import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { RoleService } from './role.service'
import {
  GetRolesQuerySchema,
  GetRolesResSchema,
  GetRoleDetailParamsSchema,
  GetRoleDetailResSchema,
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  AssignPermissionsSchema,
} from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class RoleRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly roleService: RoleService,
  ) {}

  get router() {
    const { t, adminProcedure: p } = this.trpcService
    return t.router({
      list: p
        .input(GetRolesQuerySchema)
        .output(GetRolesResSchema)
        .query(async ({ input }) => {
          const result = await this.roleService.list({
            limit: input.limit,
            page: input.page,
          })
          return result as any
        }),

      detail: p
        .input(GetRoleDetailParamsSchema)
        .output(GetRoleDetailResSchema)
        .query(async ({ input }) => {
          const result = await this.roleService.findById(input.roleId)
          return result
        }),

      create: p
        .input(CreateRoleBodySchema)
        .output(GetRoleDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.roleService.create({
            data: input,
            createdById: ctx.user!.userId,
          })
          return result as any
        }),

      update: p
        .input(
          z.object({
            params: GetRoleDetailParamsSchema,
            body: UpdateRoleBodySchema,
          }),
        )
        .output(GetRoleDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.roleService.update({
            id: input.params.roleId,
            data: input.body,
            updatedById: ctx.user!.userId,
          })
          return result
        }),

      delete: p
        .input(GetRoleDetailParamsSchema)
        .output(z.object({ message: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const result = await this.roleService.delete({
            id: input.roleId,
            deletedById: ctx.user!.userId,
          })
          return result
        }),

      assignPermissions: p
        .input(AssignPermissionsSchema)
        .output(GetRoleDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.roleService.assignPermissions({
            roleId: input.roleId,
            permissionIds: input.permissionIds,
            updatedById: ctx.user!.userId,
          })
          return result
        }),
    })
  }
}
