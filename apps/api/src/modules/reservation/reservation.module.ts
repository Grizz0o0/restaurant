import { Module } from '@nestjs/common'
import { ReservationService } from './reservation.service'
import { ReservationRouter } from './reservation.router'

@Module({
  providers: [ReservationService, ReservationRouter],
  exports: [ReservationService, ReservationRouter],
})
export class ReservationModule {}
