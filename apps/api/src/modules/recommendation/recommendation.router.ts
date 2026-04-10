import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { RecommendationService } from './recommendation.service'
import { GetRecommendationsQuerySchema, RecommendationResSchema } from '@repo/schema'

@Injectable()
export class RecommendationRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly recommendationService: RecommendationService,
  ) {}

  get router() {
    const { t, publicProcedure: p } = this.trpcService
    return t.router({
      getForUser: p
        .input(GetRecommendationsQuerySchema)
        .output(RecommendationResSchema)
        .query(async ({ input, ctx }) => {
          const userId = ctx.user?.userId
          const result = await this.recommendationService.getForUser(userId, input)
          return result
        }),

      getTopSelling: p
        .input(GetRecommendationsQuerySchema)
        .output(RecommendationResSchema)
        .query(async ({ input }) => {
          const result = await this.recommendationService.getTopSelling(input)
          return result
        }),
    })
  }
}
