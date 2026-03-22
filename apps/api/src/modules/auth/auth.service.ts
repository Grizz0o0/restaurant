import { HttpException, Injectable, NotFoundException } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms, { StringValue } from 'ms'
import { JwtService } from '@nestjs/jwt'
import {
  RegisterBodyType,
  LoginBodyType,
  SendOTPBodyType,
  RefreshTokenBodyType,
  ForgotPasswordBodyType,
  DisableTwoFactorAuthBodyType,
  ChangePasswordBodyType,
} from '@repo/schema'
import { generateOTP, isUniqueConstraintPrismaError } from '@/shared/utils'
import { TypeOfValidationCode, TypeOfValidationCodeType, UserStatus } from '@repo/constants'
import { PrismaService } from '@/shared/prisma'
import { HashingService } from '@/shared/services/hashing.service'
import { TokenService } from '@/shared/services/token.service'
import { SharedRoleRepository } from '@/shared/repositories/shared-role.repo'
import { SharedUserRepository } from '@/shared/repositories/shared-user.repo'
import { EmailService } from '@/shared/services/email.service'
import { TwoFactorAuthService } from '@/shared/services/2fa.service'
import { AuthRepository } from './auth.repo'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidPasswordException,
  InvalidRefreshTokenException,
  InvalidTokenException,
  InvalidTOTPAndCodeException,
  InvalidTOTPCodeException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  TOTPAlreadyEnabledException,
  TOTPNotEnabledException,
  UnauthorizedAccessException,
  AccountLockedException,
  OldPasswordIncorrectException,
} from './auth.error'
import envConfig from '@/shared/config'
import { AccessTokenPayloadCreate } from '@/shared/types/jwt.payload'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: SharedRoleRepository,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async validateValidationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeOfValidationCodeType
  }) {
    const validationCode = await this.authRepository.findUniqueValidationCode({
      email_code_type: {
        email,
        code,
        type,
      },
    })
    if (!validationCode) throw new InvalidOTPException()
    if (validationCode.expiresAt < new Date()) throw new OTPExpiredException()

    return validationCode
  }

  async register(body: RegisterBodyType & { ip: string; userAgent: string }) {
    try {
      await this.validateValidationCode({
        email: body.email,
        code: body.code,
        type: TypeOfValidationCode.REGISTER,
      })

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const user = await this.authRepository.createUser({
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        roleId: clientRoleId,
        status: UserStatus.ACTIVE,
      } as any)

      // Create new device
      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent: body.userAgent,
        ip: body.ip,
      })

      // Create tokens
      const tokens = await this.generateTokens({
        userId: user.id,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: 'CLIENT', // Assuming default role name for clientRoleId
      })

      return tokens
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw new EmailAlreadyExistsException()
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra xem email đã tồn tại trong hệ thống chưa
    const user = await this.sharedUserRepository.findUnique({ email: body.email })

    if (body.type === TypeOfValidationCode.REGISTER && user) throw new EmailAlreadyExistsException()
    if (body.type === TypeOfValidationCode.FORGOT_PASSWORD && (!user || user.deletedAt))
      throw new EmailNotFoundException()

    // 2. Tạo mã xác thực mới
    const code = generateOTP()
    await this.authRepository.createValidationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as StringValue)),
    })

    // 3. Gửi mã xác thực đến email
    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    })

    if (error) throw new FailedToSendOTPException()

    return { message: 'Mã xác thực OTP đã được gửi đến email của bạn' }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    //1. Lấy thông tin user, kiểm tra user có tồn tại hay không, mật khẩu có đúng không?

    const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })
    if (!user) throw new EmailNotFoundException()

    // 1.1 Check Status & Rate Limit
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedAccessException()
    }

    if (user.lockedAt) {
      const lockTime = 30 * 60 * 1000 // 30 minutes
      if (new Date().getTime() - user.lockedAt.getTime() < lockTime) {
        throw new AccountLockedException()
      }
      // Unlock if time passed
      await this.authRepository.updateUser(user.id, {
        lockedAt: null,
        failedLoginAttempts: 0,
      })
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      const failedAttempts = user.failedLoginAttempts + 1
      if (failedAttempts >= 5) {
        await this.authRepository.updateUser(user.id, {
          failedLoginAttempts: failedAttempts,
          lockedAt: new Date(),
        })
        throw new AccountLockedException()
      } else {
        await this.authRepository.updateUser(user.id, {
          failedLoginAttempts: failedAttempts,
        })
      }
      throw new InvalidPasswordException()
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedAt) {
      await this.authRepository.updateUser(user.id, { failedLoginAttempts: 0, lockedAt: null })
    }
    //2. Nếu user đã bật mã 2FA thì yêu cầu nhập mã 2FA TOTP Code hoặc OTP code
    if (user.totpSecret) {
      // Nếu không có mã TOTP và Code
      if (!body.totpCode && !body.code) throw new InvalidTOTPAndCodeException()

      //Kiểm tra TOTP Code có hợp lệ không
      if (body.totpCode) {
        const inValid = this.twoFactorAuthService.verifyTOTP({
          email: body.email,
          token: body.totpCode,
          secret: user.totpSecret,
        })

        if (!inValid) throw new InvalidTOTPCodeException()
      } else if (body.code) {
        //Kiểm tra OTP Code có hợp lệ không
        await this.validateValidationCode({
          email: body.email,
          code: body.code,
          type: TypeOfValidationCode.LOGIN,
        })
      }
    }
    //3 Tạo mới device cho user
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    })

    //4 Tạo mới accessToken và refreshToken
    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })

    return tokens
  }

  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const accessToken = this.tokenService.signAccessToken({
      userId,
      deviceId,
      roleId,
      roleName,
    })
    const refreshToken = this.tokenService.signRefreshToken({
      userId,
    })
    if (!refreshToken || !accessToken) throw new InvalidTokenException()

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    if (!decodedRefreshToken) throw new InvalidRefreshTokenException()
    await this.authRepository.createRefreshToken({
      userId,
      deviceId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      token: refreshToken,
    })
    return { accessToken, refreshToken }
  }

  async refreshToken({
    refreshToken,
    ip,
    userAgent,
  }: RefreshTokenBodyType & { ip: string; userAgent: string }) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      })
      if (!refreshTokenInDb) throw new RefreshTokenAlreadyUsedException()

      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenInDb

      // 3. Cập nhật lastActive cho device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      })
      // 4. Xóa refreshToken cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({ userId, deviceId, roleId, roleName })

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens])
      return tokens
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedAccessException()
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Xóa refreshToken trong database
      const deleteRefreshToken = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      // 3. Cập nhật device là đã logout
      await this.authRepository.updateDevice(deleteRefreshToken.deviceId, { isActive: false })

      return { message: 'Đăng xuất thành công' }
    } catch (error) {
      if (error instanceof HttpException) {
        throw new RefreshTokenAlreadyUsedException()
      }
      throw new UnauthorizedAccessException()
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    //1. Kiểm tra tài khoản đã được đăng kí chưa ?
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (!user || user.deletedAt) throw new EmailNotFoundException()

    //2. Kiểm tra OTP có hợp lệ không
    await this.validateValidationCode({
      email: body.email,
      code: body.code,
      type: TypeOfValidationCode.FORGOT_PASSWORD,
    })

    //3. Cập nhật mật khẩu và xóa OTP
    const hashedPassword = await this.hashingService.hash(body.newPassword)
    await this.sharedUserRepository.update(
      { email: body.email },
      { password: hashedPassword, updatedById: user.id },
    )

    // 4. Revoke all sessions
    await this.authRepository.deleteManyRefreshToken({ userId: user.id })

    await this.authRepository.deleteVerificationCode({
      email_code_type: {
        email: body.email,
        code: body.code,
        type: TypeOfValidationCode.FORGOT_PASSWORD,
      },
    })

    return { message: 'Đổi mật khẩu thành công' }
  }

  async setupTwoFactorAuth(userId: string) {
    //1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không và xem họ đã bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new EmailNotFoundException()
    if (user.totpSecret) throw new TOTPAlreadyEnabledException()

    //2. Tạo ra secret và uri
    const { secret, uri } = this.twoFactorAuthService.generateTOTPSecret(user.email)

    //3. Cập nhật secret vào user trong database
    await this.sharedUserRepository.update(
      { id: userId },
      { totpSecret: secret, updatedById: userId },
    )
    //4. Trả về secret và uri
    return { secret, uri }
  }

  async disableTwoFactorAuth(data: DisableTwoFactorAuthBodyType & { userId: string }) {
    const { userId, code, totpCode } = data
    //1. Lấy thông tin user, kiểm tra xem user có tồn tại hay không và xem họ bật 2FA chưa
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new EmailNotFoundException()
    if (!user.totpSecret) throw new TOTPNotEnabledException()

    //2. Kiểm tra TOTP Code có hợp lệ hay không
    if (totpCode) {
      const isValid = this.twoFactorAuthService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      })

      if (!isValid) throw new InvalidTOTPCodeException()
    } else if (code) {
      //3. Kiểm tra mã OTP code có hợp lệ hay không
      await this.validateValidationCode({
        email: user.email,
        code,
        type: TypeOfValidationCode.DISABLE_2FA,
      })
    }

    //4 Cập nhật secret thành null
    await this.sharedUserRepository.update(
      { id: userId },
      { totpSecret: null, updatedById: userId },
    )

    //5 Trả về thông báo
    return { message: 'Tắt 2FA thành công' }
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.authRepository.findSessionsByUserId(userId)
    return sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      userAgent: session.device.userAgent,
      ip: session.device.ip,
      lastActive: session.device.lastActive,
      expiresAt: session.expiresAt,
      isCurrent: false,
    }))
  }

  async revokeSession(userId: string, refreshTokenId: string) {
    await this.authRepository.deleteSessionById({
      id: refreshTokenId,
      userId: userId,
    })
    return { message: 'Đã đăng xuất thiết bị thành công' }
  }

  async revokeAllSessions(userId: string) {
    await this.authRepository.deleteManyRefreshToken({ userId })
    return { message: 'Đã đăng xuất tất cả thiết bị' }
  }

  async changePassword(userId: string, body: ChangePasswordBodyType) {
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new UnauthorizedAccessException()

    const isPasswordMatch = await this.hashingService.compare(body.oldPassword, user.password)
    if (!isPasswordMatch) throw new OldPasswordIncorrectException()

    const hashedPassword = await this.hashingService.hash(body.newPassword)
    await this.sharedUserRepository.update(
      { id: userId },
      { password: hashedPassword, updatedById: userId },
    )

    // Revoke all other sessions for security
    await this.authRepository.deleteManyRefreshToken({
      userId,
    })

    return { message: 'Đổi mật khẩu thành công' }
  }
  async guestLogin(body: { tableId: string; token: string }) {
    // 1. Check if table exists and token matches
    const table = await this.prisma.restaurantTable.findUnique({
      where: { id: body.tableId },
    })

    if (!table) throw new NotFoundException('Table not found')
    if (table.qrCode !== body.token) throw new UnauthorizedAccessException()

    // 2. Generate Access Token (No Refresh Token for Guest)
    const accessToken = this.tokenService.signAccessToken({
      userId: `guest-${table.id}`,
      deviceId: 'guest-device',
      roleId: '',
      roleName: 'GUEST',
      tableId: table.id,
    })

    return {
      accessToken,
      refreshToken: '', // Guest doesn't use refresh token
    }
  }
}
