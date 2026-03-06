import { Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { AdminService } from './admin.service'
import {
  BanUserBodySchema,
  BanUserBodyType,
  UnbanUserBodySchema,
  UnbanUserBodyType,
  ForceLogoutBodySchema,
  ForceLogoutBodyType,
  GetReportQuerySchema,
  GetReportQueryType,
  GetReportResponseSchema,
} from '@repo/schema'
import { RoleName } from '@repo/constants'

@Router({ alias: 'admin' })
@UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
export class AdminRouter {
  constructor(private readonly adminService: AdminService) {}

  @Mutation({ input: BanUserBodySchema })
  async banUser(@Input() input: BanUserBodyType) {
    return this.adminService.banUser(input.userId)
  }

  @Mutation({ input: UnbanUserBodySchema })
  async unbanUser(@Input() input: UnbanUserBodyType) {
    return this.adminService.unbanUser(input.userId)
  }

  @Mutation({ input: ForceLogoutBodySchema })
  async forceLogout(@Input() input: ForceLogoutBodyType) {
    return this.adminService.forceLogout(input.userId)
  }

  @Query()
  async getStats() {
    return this.adminService.getDashboardStats()
  }

  @Query({
    input: GetReportQuerySchema,
    output: GetReportResponseSchema,
  })
  async getReport(@Input() input: GetReportQueryType) {
    return this.adminService.getReport(input)
  }
}
