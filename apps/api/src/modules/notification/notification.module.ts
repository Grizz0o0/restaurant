import { Module } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { NotificationRouter } from './notification.router'
import { SocketModule } from '../socket/socket.module'
import { MailQueueModule } from '@/shared/queues/mail/mail-queue.module'

@Module({
  providers: [NotificationService, NotificationRouter],
  imports: [SocketModule, MailQueueModule],
  exports: [NotificationService, NotificationRouter],
})
export class NotificationModule {}
