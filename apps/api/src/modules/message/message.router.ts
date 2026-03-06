import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { z } from 'zod'
import { MessageService } from './message.service'
import {
  SendMessageBodySchema,
  SendMessageBodyType,
  GetHistoryParamsSchema,
  GetHistoryParamsType,
  GetHistoryResSchema,
  GetConversationsResSchema,
  UserSchema,
} from '@repo/schema'
import { Context } from '@/trpc/context'

@Router({ alias: 'message' })
@UseMiddlewares(AuthMiddleware)
export class MessageRouter {
  constructor(private readonly messageService: MessageService) {}

  @Mutation({
    input: SendMessageBodySchema,
    output: z.any(),
  })
  async send(@Input() input: SendMessageBodyType, @Ctx() ctx: Context) {
    return this.messageService.sendMessage(ctx.user!.userId, input)
  }

  @Query({
    input: GetHistoryParamsSchema,
    output: GetHistoryResSchema,
  })
  async getHistory(@Input() input: GetHistoryParamsType, @Ctx() ctx: Context) {
    return this.messageService.getHistory(ctx.user!.userId, input)
  }

  @Query({
    output: GetConversationsResSchema,
  })
  async getConversations(@Ctx() ctx: Context) {
    return this.messageService.getConversations(ctx.user!.userId)
  }

  @Query({
    output: z.object({ id: z.string() }).nullable(),
  })
  async getAdmin() {
    return this.messageService.getAdmin()
  }
}
