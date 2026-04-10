import { Module } from '@nestjs/common'
import { RecommendationService } from './recommendation.service'
import { RecommendationRouter } from './recommendation.router'

@Module({
  providers: [RecommendationService, RecommendationRouter],
  exports: [RecommendationService, RecommendationRouter],
})
export class RecommendationModule {}
