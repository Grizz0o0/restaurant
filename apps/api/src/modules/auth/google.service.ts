import { Injectable } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { GoogleAuthStateType } from '@repo/schema'
import { AuthRepository } from '@/modules/auth/auth.repo'
import { SharedRoleRepository } from '@/shared/repositories/shared-role.repo'
import envConfig from '@/shared/config'
import { HashingService } from '@/shared/services/hashing.service'
import { AuthService } from '@/modules/auth/auth.service'
import { GoogleUserInfoError } from './auth.error'
import { UserStatus } from 'src/generated/prisma/client'

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly rolesService: SharedRoleRepository,
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    )
  }

  getAuthorizationUrl({ userAgent, ip }: GoogleAuthStateType) {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    // Chuyển từ Object sang string base64 an toàn bỏ lên url
    const stateString = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64')
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    })

    return { url }
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'unknown'
      let ip = 'unknown'
      // 1. Lấy state từ base64
      try {
        if (state) {
          const clientInfo = JSON.parse(
            Buffer.from(state, 'base64').toString('utf-8'),
          ) as GoogleAuthStateType
          userAgent = clientInfo.userAgent
          ip = clientInfo.ip
        }
      } catch (error) {
        console.error('Error parsing state:', error)
      }

      // 2. Lấy token từ code
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // 3. Lấy thông tin người dùng từ token
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      })
      const { data } = await oauth2.userinfo.get()
      if (!data.email) throw new GoogleUserInfoError()

      let user = await this.authRepository.findUniqueUserIncludeRole({ email: data.email })
      if (!user) {
        // Nếu người dùng chưa tồn tại, tạo mới
        const clientRoleId = await this.rolesService.getClientRoleId()
        const randomPassword = uuidv4() // Tạo mật khẩu ngẫu nhiên
        const hashedPassword = await this.hashingService.hash(randomPassword)

        user = await this.authRepository.createUserIncludeRole({
          name: data.name || 'Người dùng Google',
          email: data.email,
          phoneNumber: '',
          password: hashedPassword,
          roleId: clientRoleId,
          avatar: data.picture || null,
          status: UserStatus.ACTIVE,
        } as any)
      } else if (user.status === UserStatus.INACTIVE) {
        // Nếu user đã tồn tại nhưng đang inactive (do mặc định của hệ thống), hãy kích hoạt họ
        await this.authRepository.updateUser(user.id, {
          status: UserStatus.ACTIVE,
        })
        // Refresh user data (including role)
        const updatedUser = await this.authRepository.findUniqueUserIncludeRole({ id: user.id })
        if (updatedUser) {
          user = updatedUser
        }
      }

      if (!user) {
        throw new Error('Không thể tìm hoặc tạo người dùng Google')
      }

      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent,
        ip,
      })
      const authTokens = await this.authService.generateTokens({
        userId: user.id,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return authTokens
    } catch (error) {
      console.error('Error in googleCallback', error)
      throw error
    }
  }
}
