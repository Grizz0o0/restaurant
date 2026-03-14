import { Module } from '@nestjs/common'
import { AiChatService } from './ai-chat.service'
import { AiChatRouter } from './ai-chat.router'

@Module({
  providers: [AiChatService, AiChatRouter],
  exports: [AiChatService],
})
export class AiChatModule {}
