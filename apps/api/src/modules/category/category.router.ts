import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  GetCategoriesQuerySchema,
  GetCategoriesResSchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
  CategoryDetailResSchema,
} from '@repo/schema'
import { CategoryService } from './category.service'
import { z } from 'zod'

@Injectable()
export class CategoryRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly categoryService: CategoryService,
  ) {}

  get router() {
    const { t, publicProcedure: pub, adminProcedure: admin } = this.trpcService
    return t.router({
      list: pub
        .input(GetCategoriesQuerySchema)
        .output(GetCategoriesResSchema)
        .query(async ({ input }) => {
          const result = await this.categoryService.list(input)
          return result
        }),

      detail: pub
        .input(z.object({ id: z.string() }))
        .output(CategoryDetailResSchema)
        .query(async ({ input }) => {
          const result = await this.categoryService.findById(input.id)
          return result
        }),

      create: admin
        .input(CreateCategoryBodySchema)
        .output(CategoryDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.categoryService.create({
            ...input,
            createdById: ctx.user!.userId,
          })
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdateCategoryBodySchema }))
        .output(CategoryDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.categoryService.update({
            id: input.id,
            data: input.data,
            updatedById: ctx.user!.userId,
          })
          return result
        }),

      delete: admin
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const result = await this.categoryService.delete(input.id, ctx.user!.userId)
          return result
        }),
    })
  }
}
