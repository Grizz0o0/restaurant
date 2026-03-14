import { Ctx, Input, Query, Router } from 'nestjs-trpc'
import { RecommendationService } from './recommendation.service'
import {
  GetRecommendationsQuerySchema,
  GetRecommendationsQueryType,
  RecommendationResSchema,
} from '@repo/schema'
import { Context } from '@/trpc/context'

@Router({ alias: 'recommendation' })
export class RecommendationRouter {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Query({
    input: GetRecommendationsQuerySchema,
    output: RecommendationResSchema,
  })
  async getForUser(@Input() input: GetRecommendationsQueryType, @Ctx() ctx: Context) {
    // Allows both logged in users and guests
    const userId = ctx.user?.userId
    return this.recommendationService.getForUser(userId, input)
  }

  @Query({
    input: GetRecommendationsQuerySchema,
    output: RecommendationResSchema,
  })
  async getTopSelling(@Input() input: GetRecommendationsQueryType) {
    return this.recommendationService.getTopSelling(input)
  }
}
