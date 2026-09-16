import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/shared/prisma'
import { HashingService } from '@/shared/services/hashing.service'
import { TokenService } from '@/shared/services/token.service'
import { SharedRoleRepository } from '@/shared/repositories/shared-role.repo'
import { SharedUserRepository } from '@/shared/repositories/shared-user.repo'
import { EmailService } from '@/shared/services/email.service'
import { TwoFactorAuthService } from '@/shared/services/2fa.service'
import { AuthRepository } from './auth.repo'
import { InvalidOTPException } from './auth.error'
import { TypeOfValidationCode } from '@repo/constants'

describe('AuthService', () => {
  let service: AuthService
  let authRepository: Partial<Record<keyof AuthRepository, jest.Mock>>

  beforeEach(async () => {
    authRepository = {
      findUniqueValidationCode: jest.fn(),
      createValidationCode: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: HashingService, useValue: { hash: jest.fn(), compare: jest.fn() } },
        { provide: TokenService, useValue: {} },
        { provide: SharedRoleRepository, useValue: {} },
        { provide: AuthRepository, useValue: authRepository },
        { provide: SharedUserRepository, useValue: {} },
        { provide: EmailService, useValue: { sendOtpEmail: jest.fn() } },
        { provide: TwoFactorAuthService, useValue: {} },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('validateValidationCode', () => {
    it('should throw InvalidOTPException if code not found', async () => {
      authRepository.findUniqueValidationCode?.mockResolvedValue(null)

      await expect(
        service.validateValidationCode({
          email: 'test@example.com',
          code: '123456',
          type: TypeOfValidationCode.REGISTER,
        }),
      ).rejects.toThrow(InvalidOTPException)
    })

    it('should return validationCode when code matches', async () => {
      const mockCode = {
        id: '1',
        email: 'test@example.com',
        code: '123456',
        type: TypeOfValidationCode.REGISTER,
        expiresAt: new Date(Date.now() + 10000),
      }
      authRepository.findUniqueValidationCode?.mockResolvedValue(mockCode)

      const result = await service.validateValidationCode({
        email: 'test@example.com',
        code: '123456',
        type: TypeOfValidationCode.REGISTER,
      })

      expect(result).toEqual(mockCode)
    })
  })
})
