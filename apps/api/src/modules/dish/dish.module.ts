import { Module } from '@nestjs/common'
import { DishService } from './dish.service'
import { DishRepo } from './dish.repo'
import { DishRouter } from './dish.router'

@Module({
  providers: [DishService, DishRepo, DishRouter],
  exports: [DishService, DishRepo, DishRouter],
})
export class DishModule {}
