import { Module } from '@nestjs/common'
import { MessageService } from './message.service'
import { MessageRouter } from './message.router'

@Module({
  providers: [MessageService, MessageRouter],
  exports: [MessageService, MessageRouter],
})
export class MessageModule {}
