import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { AnalyticsService } from './analytics.service'
import { LogInteractionBodySchema, TopDishesQuerySchema, TopDishesResSchema } from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class AnalyticsRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  get router() {
    const { t, publicProcedure: p } = this.trpcService
    return t.router({
      log: p
        .input(LogInteractionBodySchema)
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const userId = ctx.user?.userId
          const result = await this.analyticsService.logInteraction(userId, input)
          return result
        }),

      getTopDishes: p
        .input(TopDishesQuerySchema)
        .output(TopDishesResSchema)
        .query(async ({ input }) => {
          const result = await this.analyticsService.getTopDishes(input)
          return result
        }),
    })
  }
}
