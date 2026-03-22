import { Injectable } from '@nestjs/common'
import { TRPCError } from '@trpc/server'
import { MiddlewareOptions, TRPCMiddleware } from 'nestjs-trpc'
import { RoleName } from '@repo/constants'
import { Context } from '@/trpc/context'

@Injectable()
export class StaffRoleMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions) {
    const ctx = opts.ctx as Context
    const { next } = opts
    const user = ctx.user as { roleName: string } | undefined

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' })
    }

    const allowedRoles: string[] = [
      RoleName.Admin,
      RoleName.Manager,
      RoleName.Staff,
      RoleName.Shipper,
    ]

    if (!allowedRoles.includes(user.roleName)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied: Staff, Managers, Admins or Shippers only',
      })
    }

    return next()
  }
}
