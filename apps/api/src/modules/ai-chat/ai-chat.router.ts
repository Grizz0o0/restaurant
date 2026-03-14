import { Input, Mutation, Router } from 'nestjs-trpc'
import { AiChatService } from './ai-chat.service'
import { AiChatBodySchema, AiChatBodyType, AiChatResSchema } from '@repo/schema'

@Router({ alias: 'aiChat' })
export class AiChatRouter {
  constructor(private readonly aiChatService: AiChatService) {}

  @Mutation({
    input: AiChatBodySchema,
    output: AiChatResSchema,
  })
  async chat(@Input() input: AiChatBodyType) {
    return this.aiChatService.chat(input.message, input.history)
  }
}
