import { Global, Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { AccessTokenGuard } from './guards/access-token.guard'
import { APIKeyGuard } from './guards/api-key.guard'
import { SharedUserRepository } from '@/shared/repositories/shared-user.repo'
import { SharedRoleRepository } from '@/shared/repositories/shared-role.repo'
import { EmailService } from '@/shared/services/email.service'
import { TwoFactorAuthService } from '@/shared/services/2fa.service'
import { AiService } from '@/shared/services/ai.service'

const shareServices = [
  HashingService,
  TokenService,
  SharedUserRepository,
  SharedRoleRepository,
  EmailService,
  TwoFactorAuthService,
  AiService,
]

@Global()
@Module({
  providers: [...shareServices, AccessTokenGuard, APIKeyGuard],
  exports: [...shareServices, AccessTokenGuard, APIKeyGuard, PrismaModule],
  imports: [JwtModule, PrismaModule],
})
export class SharedModule {}
