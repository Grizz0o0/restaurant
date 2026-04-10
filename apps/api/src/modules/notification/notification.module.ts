import { Module } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { NotificationRouter } from './notification.router'
import { SocketModule } from '../socket/socket.module'

@Module({
  providers: [NotificationService, NotificationRouter],
  imports: [SocketModule],
  exports: [NotificationService, NotificationRouter],
})
export class NotificationModule {}
