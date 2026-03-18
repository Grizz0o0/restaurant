import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { RoleName } from '@repo/constants'
import { UserService } from './user.service'
import {
  GetUsersQuerySchema,
  GetUsersResSchema,
  GetUserDetailParamsSchema,
  UserDetailResSchema,
  CreateUserBodySchema,
  UpdateUserBodySchema,
  GetUsersQueryType,
  GetUserDetailParamsType,
  CreateUserBodyType,
  UpdateUserBodyType,
} from '@repo/schema'
import { Context } from '@/trpc/context'
import z from 'zod'

@Router({ alias: 'user' })
@UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
export class UserRouter {
  constructor(private readonly userService: UserService) {}

  @Query({
    input: GetUsersQuerySchema,
    output: GetUsersResSchema,
  })
  async list(@Input() input: GetUsersQueryType) {
    const result = await this.userService.list({
      limit: input.limit,
      page: input.page,
      roleId: input.roleId,
      status: input.status,
    })
    
    const parsed = GetUsersResSchema.safeParse(result)
    if (!parsed.success) {
      console.error('User list validation error:', JSON.stringify(parsed.error.format(), null, 2))
    }
    
    return result
  }

  @Query({
    input: GetUserDetailParamsSchema,
    output: UserDetailResSchema,
  })
  async detail(@Input() input: GetUserDetailParamsType) {
    return this.userService.findById(input.userId)
  }

  @Mutation({
    input: CreateUserBodySchema,
    output: UserDetailResSchema,
  })
  async create(@Input() input: CreateUserBodyType, @Ctx() ctx: Context) {
    return this.userService.create({ data: input, createdById: ctx.user!.userId })
  }

  @Mutation({
    input: z.object({
      params: GetUserDetailParamsSchema,
      body: UpdateUserBodySchema,
    }),
    output: UserDetailResSchema,
  })
  async update(
    @Input() input: { params: GetUserDetailParamsType; body: UpdateUserBodyType },
    @Ctx() ctx: Context,
  ) {
    return this.userService.update({
      id: input.params.userId,
      data: input.body,
      updatedById: ctx.user!.userId,
    })
  }

  @Mutation({
    input: GetUserDetailParamsSchema,
    output: z.object({ message: z.string() }),
  })
  async delete(@Input() input: GetUserDetailParamsType, @Ctx() ctx: Context) {
    return this.userService.delete({ id: input.userId, deletedById: ctx.user!.userId })
  }
}
