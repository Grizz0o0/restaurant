import { Module } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { PaymentRouter } from './payment.router'
import { PrismaModule } from '@/shared/prisma/prisma.module'
import { EventEmitterModule } from '@nestjs/event-emitter'

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRouter],
  exports: [PaymentService],
})
export class PaymentModule {}
