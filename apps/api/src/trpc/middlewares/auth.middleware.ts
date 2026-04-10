import { Injectable, Logger } from '@nestjs/common'
import { TRPCError } from '@trpc/server'
import { TokenService } from '@/shared/services/token.service'
import { REQUEST_USER_KEY } from '@repo/constants'
import { AccessTokenPayload } from '@/shared/types/jwt.payload'
import { Context } from '@/trpc/context'

@Injectable()
export class AuthMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name)

  constructor(private readonly tokenService: TokenService) {}

  async use(opts: { ctx: unknown; next: (opts?: any) => Promise<any> }) {
    const ctx = opts.ctx as Context
    const { next } = opts
    const req = ctx.req

    if (!req) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Request object missing in context',
      })
    }

    const authHeader = req.headers['authorization']
    if (!authHeader) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Missing Authorization header' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Authorization header format' })
    }

    try {
      const decoded: AccessTokenPayload = await this.tokenService.verifyAccessToken(token)
      ctx.user = decoded
      ;(req as any)[REQUEST_USER_KEY] = decoded
    } catch (err) {
      this.logger.warn(`Authentication failed: ${err instanceof Error ? err.message : err}`)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' })
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    })
  }
}
