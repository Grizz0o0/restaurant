import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { PromotionService } from './promotion.service'
import {
  CreatePromotionSchema,
  UpdatePromotionSchema,
  ApplyPromotionSchema,
  PromotionSchema,
  ApplyPromotionResSchema,
} from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class PromotionRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly promotionService: PromotionService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot, adminProcedure: admin } = this.trpcService
    return t.router({
      create: admin
        .input(CreatePromotionSchema)
        .output(PromotionSchema)
        .mutation(async ({ input }) => {
          const result = await this.promotionService.create(input)
          return result
        }),

      list: admin.output(z.array(PromotionSchema)).query(async () => {
        const result = await this.promotionService.findAll()
        return result
      }),

      get: admin
        .input(z.object({ id: z.string() }))
        .output(PromotionSchema)
        .query(async ({ input }) => {
          const result = await this.promotionService.findOne(input.id)
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdatePromotionSchema }))
        .output(PromotionSchema)
        .mutation(async ({ input }) => {
          const result = await this.promotionService.update(input.id, input.data)
          return result
        }),

      delete: admin
        .input(z.object({ id: z.string() }))
        .output(PromotionSchema)
        .mutation(async ({ input }) => {
          const result = await this.promotionService.remove(input.id)
          return result
        }),

      applyCode: prot
        .input(ApplyPromotionSchema)
        .output(ApplyPromotionResSchema)
        .mutation(async ({ input }) => {
          const result = await this.promotionService.apply(input)
          return result
        }),
    })
  }
}
