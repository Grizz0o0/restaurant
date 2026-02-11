import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import {
  GetCategoriesQuerySchema,
  GetCategoriesResSchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
  CreateCategoryBodyType,
  GetCategoriesQueryType,
  UpdateCategoryBodyType,
  CategoryDetailResSchema,
} from '@repo/schema'
import { Context } from '@/trpc/context'
import { CategoryService } from './category.service'
import { z } from 'zod'

@Router({ alias: 'category' })
export class CategoryRouter {
  constructor(private readonly categoryService: CategoryService) {}

  @Query({
    input: GetCategoriesQuerySchema,
    output: GetCategoriesResSchema,
  })
  async list(@Input() input: GetCategoriesQueryType) {
    return this.categoryService.list(input)
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: CategoryDetailResSchema,
  })
  async detail(@Input('id') id: string) {
    return this.categoryService.findById(id)
  }

  @Mutation({
    input: CreateCategoryBodySchema,
    output: CategoryDetailResSchema,
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async create(@Input() input: CreateCategoryBodyType, @Ctx() ctx: Context) {
    return this.categoryService.create({ ...input, createdById: ctx.user!.userId })
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: UpdateCategoryBodySchema,
    }),
    output: CategoryDetailResSchema,
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async update(@Input() input: { id: string; data: UpdateCategoryBodyType }, @Ctx() ctx: Context) {
    return this.categoryService.update({
      id: input.id,
      data: input.data,
      updatedById: ctx.user!.userId,
    })
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async delete(@Input('id') id: string, @Ctx() ctx: Context) {
    return this.categoryService.delete(id, ctx.user!.userId)
  }
}
