import { Injectable } from '@nestjs/common'
import { TRPCError } from '@trpc/server'
import { RoleName } from '@repo/constants'
import { Context } from '@/trpc/context'

@Injectable()
export class AdminRoleMiddleware {
  async use(opts: { ctx: unknown; next: (opts?: any) => Promise<any> }) {
    const ctx = opts.ctx as Context
    const { next } = opts
    const user = ctx.user as { roleName: string } | undefined

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' })
    }

    if (user.roleName !== RoleName.Admin) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied: Admins only' })
    }

    return next()
  }
}
