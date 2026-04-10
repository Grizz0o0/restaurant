import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { AuthService } from './auth.service'
import { GoogleService } from './google.service'
import {
  RegisterBodySchema,
  LoginBodySchema,
  RegisterResSchema,
  LoginResSchema,
  SendOTPBodySchema,
  ForgotPasswordBodySchema,
  RefreshTokenBodySchema,
  LogoutBodySchema,
  GetAuthorizationUrlResSchema,
  RefreshTokenResSchema,
  GoogleCallbackBodySchema,
  GetSessionsResSchema,
  RevokeSessionBodySchema,
  RevokeAllSessionsResSchema,
  ChangePasswordBodySchema,
  GuestLoginBodySchema,
  TwoFactorSetupResSchema,
  DisableTwoFactorAuthBodySchema,
} from '@repo/schema'

@Injectable()
export class AuthRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  get router() {
    const { t, publicProcedure: pub, protectedProcedure: prot } = this.trpcService
    return t.router({
      register: pub
        .input(RegisterBodySchema)
        .output(RegisterResSchema)
        .mutation(async ({ input, ctx }) => {
          const userAgent = ctx.req.headers['user-agent'] || ''
          const ip = ctx.req.ip || ctx.req.connection?.remoteAddress || ''
          const result = await this.authService.register({ ...input, userAgent, ip })
          return result
        }),

      login: pub
        .input(LoginBodySchema)
        .output(LoginResSchema)
        .mutation(async ({ input, ctx }) => {
          const userAgent = ctx.req.headers['user-agent'] || ''
          const ip = ctx.req.ip || ctx.req.connection?.remoteAddress || ''
          const result = await this.authService.login({ ...input, userAgent, ip })
          return result
        }),

      refreshToken: pub
        .input(RefreshTokenBodySchema)
        .output(RefreshTokenResSchema)
        .mutation(async ({ input, ctx }) => {
          const userAgent = ctx.req.headers['user-agent'] || ''
          const ip = ctx.req.ip || ctx.req.connection?.remoteAddress || ''
          const result = await this.authService.refreshToken({ ...input, userAgent, ip })
          return result
        }),

      sendOTP: pub.input(SendOTPBodySchema).mutation(async ({ input }) => {
        const result = await this.authService.sendOTP(input)
        return result
      }),

      logout: pub.input(LogoutBodySchema).mutation(async ({ input }) => {
        const result = await this.authService.logout(input.refreshToken)
        return result
      }),

      forgotPassword: pub.input(ForgotPasswordBodySchema).mutation(async ({ input }) => {
        const result = await this.authService.forgotPassword(input)
        return result
      }),

      googleUrl: pub.output(GetAuthorizationUrlResSchema).query(({ ctx }) => {
        const userAgent = ctx.req.headers['user-agent'] || ''
        const ip = ctx.req.ip || ctx.req.connection?.remoteAddress || ''
        const result = this.googleService.getAuthorizationUrl({ ip, userAgent })
        return result
      }),

      googleCallback: pub
        .input(GoogleCallbackBodySchema)
        .output(LoginResSchema)
        .mutation(async ({ input }) => {
          const result = await this.googleService.googleCallback(input)
          return result
        }),

      getActiveSessions: prot.output(GetSessionsResSchema).query(async ({ ctx }) => {
        const result = await this.authService.getActiveSessions(ctx.user!.userId)
        return result
      }),

      revokeSession: prot.input(RevokeSessionBodySchema).mutation(async ({ input, ctx }) => {
        const result = await this.authService.revokeSession(ctx.user!.userId, input.id)
        return result
      }),

      revokeAllSessions: prot.output(RevokeAllSessionsResSchema).mutation(async ({ ctx }) => {
        const result = await this.authService.revokeAllSessions(ctx.user!.userId)
        return result
      }),

      changePassword: prot.input(ChangePasswordBodySchema).mutation(async ({ input, ctx }) => {
        const result = await this.authService.changePassword(ctx.user!.userId, input)
        return result
      }),

      guestLogin: pub
        .input(GuestLoginBodySchema)
        .output(LoginResSchema)
        .mutation(async ({ input }) => {
          const result = await this.authService.guestLogin(input)
          return result
        }),

      setup2FA: prot.output(TwoFactorSetupResSchema).mutation(async ({ ctx }) => {
        const result = await this.authService.setupTwoFactorAuth(ctx.user!.userId)
        return result
      }),

      disable2FA: prot.input(DisableTwoFactorAuthBodySchema).mutation(async ({ input, ctx }) => {
        const result = await this.authService.disableTwoFactorAuth({
          ...input,
          userId: ctx.user!.userId,
        })
        return result
      }),
    })
  }
}
