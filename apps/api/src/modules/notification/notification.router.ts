import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { NotificationService } from './notification.service'
import { SendPushNotificationSchema, NotificationSchema, MarkAsReadSchema } from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class NotificationRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly notificationService: NotificationService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      sendPush: prot
        .input(SendPushNotificationSchema)
        .output(SendPushNotificationSchema)
        .mutation(async ({ input }) => {
          await this.notificationService.send(
            input.userId,
            input.title,
            input.body,
            'PROMOTION',
            input.data,
          )
          return input
        }),

      getNotifications: prot.output(z.array(NotificationSchema)).query(async ({ ctx }) => {
        const result = await this.notificationService.getNotifications(ctx.user!.userId)
        return result as any
      }),

      markAsRead: prot
        .input(MarkAsReadSchema)
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
          const result = await this.notificationService.markAsRead(ctx.user!.userId, input.id)
          return result
        }),
    })
  }
}
