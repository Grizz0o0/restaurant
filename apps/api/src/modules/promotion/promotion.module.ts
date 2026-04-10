import { Module } from '@nestjs/common'
import { PromotionService } from './promotion.service'
import { PromotionRouter } from './promotion.router'

@Module({
  providers: [PromotionService, PromotionRouter],
  exports: [PromotionRouter],
})
export class PromotionModule {}
