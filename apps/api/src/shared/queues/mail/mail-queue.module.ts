import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MailQueueService } from './mail-queue.service'
import { MailConsumer } from './mail.consumer'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  providers: [MailQueueService, MailConsumer],
  exports: [MailQueueService, BullModule],
})
export class MailQueueModule {}
