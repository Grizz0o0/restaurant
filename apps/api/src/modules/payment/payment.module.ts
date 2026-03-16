import { Module } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { PaymentRouter } from './payment.router'
import { EventEmitterModule } from '@nestjs/event-emitter'

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRouter],
  exports: [PaymentService],
})
export class PaymentModule {}
