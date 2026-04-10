import { Module } from '@nestjs/common'
import { ReviewRepo } from './review.repo'
import { ReviewService } from './review.service'
import { ReviewRouter } from './review.router'

@Module({
  providers: [ReviewRepo, ReviewService, ReviewRouter],
  exports: [ReviewService, ReviewRouter],
})
export class ReviewModule {}
