import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { StaffRoleMiddleware } from '@/trpc/middlewares/staff-role.middleware'
import {
  CreateOrderBodySchema,
  CreateOrderBodyType,
  CreateOrderFromCartSchema,
  CreateOrderFromCartType,
  GetOrdersQuerySchema,
  GetOrdersQueryType,
  GetOrdersResSchema,
  OrderSchema,
  UpdateOrderStatusSchema,
  UpdateOrderStatusType,
} from '@repo/schema'
import { RoleName } from '@repo/constants'
import { Context } from '@/trpc/context'
import { OrderService } from './order.service'

@Router({ alias: 'order' })
@UseMiddlewares(AuthMiddleware)
export class OrderRouter {
  constructor(private readonly orderService: OrderService) {}

  @Mutation({
    input: CreateOrderBodySchema,
    output: OrderSchema,
  })
  async create(@Input() input: CreateOrderBodyType, @Ctx() ctx: Context) {
    return this.orderService.create({
      data: input,
      userId: ctx.user!.userId,
      tableId: ctx.user!.tableId,
      roleName: ctx.user!.roleName,
    })
  }

  @Query({
    input: GetOrdersQuerySchema,
    output: GetOrdersResSchema,
  })
  @UseMiddlewares(StaffRoleMiddleware) // Allow Admin, Manager, and Staff to see kitchen queue/order list
  async list(@Input() input: GetOrdersQueryType) {
    return this.orderService.list(input)
  }

  @Query({
    input: GetOrdersQuerySchema,
    output: GetOrdersResSchema,
  })
  async myOrders(@Input() input: GetOrdersQueryType, @Ctx() ctx: Context) {
    const isShipper = ctx.user!.roleName === RoleName.Shipper
    return this.orderService.list({
      ...input,
      ...(isShipper ? { shipperId: ctx.user!.userId } : { userId: ctx.user!.userId }),
    })
  }

  @Mutation({
    input: CreateOrderFromCartSchema,
    output: OrderSchema,
  })
  async createFromCart(@Input() input: CreateOrderFromCartType, @Ctx() ctx: Context) {
    return this.orderService.createFromCart({
      ...input,
      userId: ctx.user!.userId,
      tableId: ctx.user!.tableId,
      roleName: ctx.user!.roleName,
    })
  }

  @Mutation({
    input: UpdateOrderStatusSchema,
    output: OrderSchema,
  })
  @UseMiddlewares(StaffRoleMiddleware)
  async updateStatus(@Input() input: UpdateOrderStatusType, @Ctx() ctx: Context) {
    return this.orderService.updateStatus(
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
  }
}
