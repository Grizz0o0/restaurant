import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { PaymentService } from './payment.service'
import {
  CheckPaymentStatusInputSchema,
  CheckPaymentStatusOutputSchema,
  RefundPaymentInputSchema,
  RefundPaymentOutputSchema,
  GetTransactionsQuerySchema,
  GetTransactionsResSchema,
} from '@repo/schema'
import { z } from 'zod'

const InitiatePaymentInput = z.object({
  orderId: z.string(),
})

const InitiatePaymentOutput = z.object({
  payUrl: z.string().url(),
  deeplink: z.string().optional(),
})

@Injectable()
export class PaymentRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly paymentService: PaymentService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot, dynamicProcedure: dynamic } = this.trpcService
    return t.router({
      initiate: prot
        .input(InitiatePaymentInput)
        .output(InitiatePaymentOutput)
        .mutation(async ({ input, ctx }) => {
          const result = await this.paymentService.initiatePayment(input.orderId, ctx.user!.userId)
          return result
        }),

      checkStatus: prot
        .input(CheckPaymentStatusInputSchema)
        .output(CheckPaymentStatusOutputSchema)
        .mutation(async ({ input }) => {
          const result = await this.paymentService.checkTransactionStatus(input.orderId)
          return result
        }),

      refund: dynamic
        .input(RefundPaymentInputSchema)
        .output(RefundPaymentOutputSchema)
        .mutation(async ({ input }) => {
          const result = await this.paymentService.refundTransaction(input.orderId)
          return result
        }),

      transactions: dynamic
        .input(GetTransactionsQuerySchema)
        .output(GetTransactionsResSchema)
        .query(async ({ input }) => {
          const result = await this.paymentService.listTransactions(input)
          return result
        }),
    })
  }
}
