import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  GetDishesQuerySchema,
  GetDishesResSchema,
  CreateDishBodySchema,
  UpdateDishBodySchema,
  DishDetailResSchema,
} from '@repo/schema'
import { DishService } from './dish.service'
import { z } from 'zod'

@Injectable()
export class DishRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly dishService: DishService,
  ) {}

  get router() {
    const { t, publicProcedure: pub, adminProcedure: admin } = this.trpcService
    return t.router({
      list: pub
        .input(GetDishesQuerySchema)
        .output(GetDishesResSchema)
        .query(async ({ input }) => {
          const result = await this.dishService.list(input)
          return result
        }),

      detail: pub
        .input(z.object({ id: z.string() }))
        .output(DishDetailResSchema)
        .query(async ({ input }) => {
          const result = await this.dishService.findById(input.id)
          return result
        }),

      create: admin
        .input(CreateDishBodySchema)
        .output(DishDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.dishService.create({ ...input, createdById: ctx.user!.userId })
          return result
        }),

      checkVariantUpdate: admin
        .input(z.object({ id: z.string(), variants: UpdateDishBodySchema.shape.variants }))
        .output(z.array(z.object({ id: z.string(), value: z.string() })))
        .mutation(async ({ input }) => {
          const result = await this.dishService.checkVariantUpdateImpact(input.id, input.variants)
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdateDishBodySchema }))
        .output(DishDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.dishService.update({
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
          const result = await this.dishService.delete(input.id, ctx.user!.userId)
          return result
        }),
    })
  }
}
