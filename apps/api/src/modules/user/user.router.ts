import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { UserService } from './user.service'
import {
  GetUsersQuerySchema,
  GetUsersResSchema,
  GetUserDetailParamsSchema,
  UserDetailResSchema,
  CreateUserBodySchema,
  UpdateUserBodySchema,
} from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class UserRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly userService: UserService,
  ) {}

  get router() {
    const { t, adminProcedure: p } = this.trpcService
    return t.router({
      list: p
        .input(GetUsersQuerySchema)
        .output(GetUsersResSchema)
        .query(async ({ input }) => {
          const result = await this.userService.list({
            limit: input.limit,
            page: input.page,
            roleId: input.roleId,
            status: input.status,
          })

          const parsed = GetUsersResSchema.safeParse(result)
          if (!parsed.success) {
            console.error(
              'User list validation error:',
              JSON.stringify(parsed.error.format(), null, 2),
            )
          }

          return result as any
        }),

      detail: p
        .input(GetUserDetailParamsSchema)
        .output(UserDetailResSchema)
        .query(async ({ input }) => {
          const result = await this.userService.findById(input.userId)
          return result
        }),

      create: p
        .input(CreateUserBodySchema)
        .output(UserDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.userService.create({
            data: input,
            createdById: ctx.user!.userId,
          })
          return result
        }),

      update: p
        .input(
          z.object({
            params: GetUserDetailParamsSchema,
            body: UpdateUserBodySchema,
          }),
        )
        .output(UserDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.userService.update({
            id: input.params.userId,
            data: input.body,
            updatedById: ctx.user!.userId,
          })
          return result
        }),

      delete: p
        .input(GetUserDetailParamsSchema)
        .output(z.object({ message: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const result = await this.userService.delete({
            id: input.userId,
            deletedById: ctx.user!.userId,
          })
          return result
        }),
    })
  }
}
