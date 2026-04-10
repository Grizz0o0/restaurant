import { Module } from '@nestjs/common'
import { ContactService } from './contact.service'
import { ContactRouter } from './contact.router'
import { NotificationModule } from '../notification/notification.module'

@Module({
  imports: [NotificationModule],
  providers: [ContactService, ContactRouter],
  exports: [ContactService, ContactRouter],
})
export class ContactModule {}
