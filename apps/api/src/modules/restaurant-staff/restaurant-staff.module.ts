import { Module } from '@nestjs/common'
import { RestaurantStaffService } from './restaurant-staff.service'
import { RestaurantStaffRouter } from './restaurant-staff.router'

@Module({
  providers: [RestaurantStaffService, RestaurantStaffRouter],
  exports: [RestaurantStaffService],
})
export class RestaurantStaffModule {}
