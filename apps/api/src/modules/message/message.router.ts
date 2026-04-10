import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { MessageService } from './message.service'
import {
  SendMessageBodySchema,
  GetHistoryParamsSchema,
  GetHistoryResSchema,
  GetConversationsResSchema,
} from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class MessageRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly messageService: MessageService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      send: prot
        .input(SendMessageBodySchema)
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const result = await this.messageService.sendMessage(ctx.user!.userId, input)
          return result
        }),

      getHistory: prot
        .input(GetHistoryParamsSchema)
        .output(GetHistoryResSchema)
        .query(async ({ input, ctx }) => {
          const result = await this.messageService.getHistory(ctx.user!.userId, input)
          return result
        }),

      getConversations: prot.output(GetConversationsResSchema).query(async ({ ctx }) => {
        const result = await this.messageService.getConversations(ctx.user!.userId)
        return result
      }),

      getAdmin: prot.output(z.object({ id: z.string() }).nullable()).query(async () => {
        const result = await this.messageService.getAdmin()
        return result
      }),
    })
  }
}
