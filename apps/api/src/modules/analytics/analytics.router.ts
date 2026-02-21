import { Ctx, Input, Mutation, Query, Router } from 'nestjs-trpc'
import { z } from 'zod'
import { AnalyticsService } from './analytics.service'
import {
  LogInteractionBodySchema,
  LogInteractionBodyType,
  TopDishesQuerySchema,
  TopDishesQueryType,
  TopDishesResSchema,
} from '@repo/schema'
import { Context } from '@/trpc/context'

@Router({ alias: 'analytics' })
export class AnalyticsRouter {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Mutation({
    input: LogInteractionBodySchema,
    output: z.any(),
  })
  async log(@Input() input: LogInteractionBodyType, @Ctx() ctx: Context) {
    // Allows both logged in users and guests
    const userId = ctx.user?.userId
    return this.analyticsService.logInteraction(userId, input)
  }

  @Query({
    input: TopDishesQuerySchema,
    output: TopDishesResSchema,
  })
  async getTopDishes(@Input() input: TopDishesQueryType) {
    return this.analyticsService.getTopDishes(input)
  }
}
