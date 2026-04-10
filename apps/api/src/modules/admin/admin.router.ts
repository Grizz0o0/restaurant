import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { AdminService } from './admin.service'
import {
  BanUserBodySchema,
  UnbanUserBodySchema,
  ForceLogoutBodySchema,
  GetReportQuerySchema,
  GetReportResponseSchema,
} from '@repo/schema'

@Injectable()
export class AdminRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly adminService: AdminService,
  ) {}

  get router() {
    const { t, adminProcedure: p } = this.trpcService
    return t.router({
      banUser: p.input(BanUserBodySchema).mutation(async ({ input }) => {
        const result = await this.adminService.banUser(input.userId)
        return result
      }),

      unbanUser: p.input(UnbanUserBodySchema).mutation(async ({ input }) => {
        const result = await this.adminService.unbanUser(input.userId)
        return result
      }),

      forceLogout: p.input(ForceLogoutBodySchema).mutation(async ({ input }) => {
        const result = await this.adminService.forceLogout(input.userId)
        return result
      }),

      getStats: p.query(async () => {
        const result = await this.adminService.getDashboardStats()
        return result
      }),

      getReport: p
        .input(GetReportQuerySchema)
        .output(GetReportResponseSchema)
        .query(async ({ input }) => {
          const result = await this.adminService.getReport(input)
          return result
        }),
    })
  }
}
