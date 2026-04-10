import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { PermissionService } from './permission.service'
import {
  GetPermissionsQuerySchema,
  GetPermissionsResSchema,
  GetPermissionParamsSchema,
  GetPermissionDetailResSchema,
  CreatePermissionBodySchema,
  UpdatePermissionBodySchema,
} from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class PermissionRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly permissionService: PermissionService,
  ) {}

  get router() {
    const { t, adminProcedure: p } = this.trpcService
    return t.router({
      list: p
        .input(GetPermissionsQuerySchema)
        .output(GetPermissionsResSchema)
        .query(async ({ input }) => {
          const result = await this.permissionService.list({
            limit: input.limit,
            page: input.page,
          })
          return result as any
        }),

      detail: p
        .input(GetPermissionParamsSchema)
        .output(GetPermissionDetailResSchema)
        .query(async ({ input }) => {
          const result = await this.permissionService.findById(input.permissionId)
          return result
        }),

      create: p
        .input(CreatePermissionBodySchema)
        .output(GetPermissionDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.permissionService.create({
            data: input,
            createdById: ctx.user!.userId,
          })
          return result
        }),

      update: p
        .input(
          z.object({
            params: GetPermissionParamsSchema,
            body: UpdatePermissionBodySchema,
          }),
        )
        .output(GetPermissionDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.permissionService.update({
            id: input.params.permissionId,
            data: input.body,
            updatedById: ctx.user!.userId,
          })
          return result
        }),

      delete: p
        .input(GetPermissionParamsSchema)
        .output(z.object({ message: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const result = await this.permissionService.delete({
            id: input.permissionId,
            deletedById: ctx.user!.userId,
          })
          return result
        }),
    })
  }
}
