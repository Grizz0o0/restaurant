import { Injectable, Logger } from '@nestjs/common'
import { TRPCError } from '@trpc/server'
import { MiddlewareOptions, TRPCMiddleware } from 'nestjs-trpc'
import { Context } from '@/trpc/context'
import { PrismaService } from '@/shared/prisma'

@Injectable()
export class DynamicAuthMiddleware implements TRPCMiddleware {
  private readonly logger = new Logger(DynamicAuthMiddleware.name)

  constructor(private readonly prisma: PrismaService) {}

  async use(opts: MiddlewareOptions) {
    const ctx = opts.ctx as Context
    const { next, path, type } = opts

    // 1. Bypass if user is Admin
    if (ctx.user?.roleName === 'ADMIN') {
      return next()
    }

    // 2. Identify the required permission
    const method = type === 'mutation' ? 'POST' : 'GET'
    const requiredPath = path

    if (!ctx.user) {
      // Not logged in
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    // Get Permissions for Role
    const roleWithPermissions = await this.prisma.role.findUnique({
      where: { id: ctx.user.roleId },
      include: { permissions: true },
    })

    if (!roleWithPermissions) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Role not found' })
    }

    // Check match
    const hasPermission = roleWithPermissions.permissions.some(
      (p) => p.path === requiredPath && p.method === method,
    )

    if (!hasPermission) {
      const permissionRecord = await this.prisma.permission.findUnique({
        where: { path_method: { path: requiredPath, method: method as any } },
      })

      if (permissionRecord) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Missing permission: ${requiredPath} (${method})`,
        })
      }
    }

    return next()
  }
}
