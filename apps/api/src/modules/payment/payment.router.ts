import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { z } from 'zod'
import { PaymentService } from './payment.service'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { Context } from '@/trpc/context'
import { DynamicAuthMiddleware } from '@/trpc/middlewares/dynamic-auth.middleware'
import {
  CheckPaymentStatusInputSchema,
  CheckPaymentStatusOutputSchema,
  RefundPaymentInputSchema,
  RefundPaymentOutputSchema,
  GetTransactionsQuerySchema,
  GetTransactionsResSchema,
  GetTransactionsQueryType,
} from '@repo/schema'

const InitiatePaymentInput = z.object({
  orderId: z.string(),
})

const InitiatePaymentOutput = z.object({
  payUrl: z.string().url(),
  deeplink: z.string().optional(),
})

@Router({ alias: 'payment' })
@UseMiddlewares(AuthMiddleware)
export class PaymentRouter {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation({
    input: InitiatePaymentInput,
    output: InitiatePaymentOutput,
  })
  async initiate(@Input() input: { orderId: string }, @Ctx() ctx: Context) {
    // 1. Validate order exists and belongs to user (optional but recommended)
    // For now assuming internal checks or just ID.

    // 2. Fetch order amount (should be done inside service to be safe)
    // We'll let service handle logic.

    const result = await this.paymentService.initiatePayment(input.orderId, ctx.user!.userId)
    return result
  }

  @Mutation({
    input: CheckPaymentStatusInputSchema,
    output: CheckPaymentStatusOutputSchema,
  })
  async checkStatus(@Input() input: { orderId: string }) {
    return this.paymentService.checkTransactionStatus(input.orderId)
  }

  @Mutation({
    input: RefundPaymentInputSchema,
    output: RefundPaymentOutputSchema,
  })
  @UseMiddlewares(DynamicAuthMiddleware)
  async refund(@Input() input: { orderId: string }) {
    return this.paymentService.refundTransaction(input.orderId)
  }

  @Query({
    input: GetTransactionsQuerySchema,
    output: GetTransactionsResSchema,
  })
  @UseMiddlewares(DynamicAuthMiddleware)
  async transactions(@Input() input: GetTransactionsQueryType) {
    return this.paymentService.listTransactions(input)
  }
}
