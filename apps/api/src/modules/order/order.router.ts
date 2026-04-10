import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateOrderBodySchema,
  CreateOrderFromCartSchema,
  GetOrdersQuerySchema,
  GetOrdersResSchema,
  OrderSchema,
  UpdateOrderStatusSchema,
} from '@repo/schema'
import { RoleName } from '@repo/constants'
import { OrderService } from './order.service'

@Injectable()
export class OrderRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly orderService: OrderService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot, staffProcedure: staff } = this.trpcService
    return t.router({
      create: prot
        .input(CreateOrderBodySchema)
        .output(OrderSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.orderService.create({
            data: input,
            userId: ctx.user!.userId,
            tableId: ctx.user!.tableId,
            roleName: ctx.user!.roleName,
          })
          return result
        }),

      list: staff
        .input(GetOrdersQuerySchema)
        .output(GetOrdersResSchema)
        .query(async ({ input }) => {
          const result = await this.orderService.list(input)
          return result
        }),

      myOrders: prot
        .input(GetOrdersQuerySchema)
        .output(GetOrdersResSchema)
        .query(async ({ input, ctx }) => {
          const isShipper = ctx.user!.roleName === RoleName.Shipper
          const result = await this.orderService.list({
            ...input,
            ...(isShipper ? { shipperId: ctx.user!.userId } : { userId: ctx.user!.userId }),
          })
          return result
        }),

      createFromCart: prot
        .input(CreateOrderFromCartSchema)
        .output(OrderSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.orderService.createFromCart({
            ...input,
            userId: ctx.user!.userId,
            tableId: ctx.user!.tableId,
            roleName: ctx.user!.roleName,
          })
          return result
        }),

      updateStatus: staff
        .input(UpdateOrderStatusSchema)
        .output(OrderSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.orderService.updateStatus(
            input.orderId,
            input.status,
            ctx.user!.userId,
            ctx.user!.roleName,
            {
              verificationCode: input.verificationCode,
              reason: input.reason,
              promotionId: input.promotionId,
              discount: input.discount,
            },
          )
          return result
        }),
    })
  }
}
