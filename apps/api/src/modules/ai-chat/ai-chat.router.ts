import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { AiChatService } from './ai-chat.service'
import { AiChatBodySchema, AiChatResSchema } from '@repo/schema'

@Injectable()
export class AiChatRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly aiChatService: AiChatService,
  ) {}

  get router() {
    const { t, publicProcedure: p } = this.trpcService
    return t.router({
      chat: p
        .input(AiChatBodySchema)
        .output(AiChatResSchema)
        .mutation(async ({ input }) => {
          const result = await this.aiChatService.chat(input.message, input.history)
          return result
        }),
    })
  }
}
