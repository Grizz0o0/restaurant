import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthRouter } from './auth.router'
import { AuthRepository } from './auth.repo'
import { GoogleService } from './google.service'
import envConfig from '@/shared/config'

@Module({
  imports: [
    JwtModule.register({
      secret: envConfig.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, AuthRouter, AuthRepository, GoogleService],
  exports: [AuthRepository, AuthRouter],
})
export class AuthModule {}
