import { z } from 'zod';

export const PaymentTransactionSchema = z.object({
    id: z.string().uuid(),
    gateway: z.string(),
    amountIn: z.number().optional(),
    amountOut: z.number().optional(),
    accumulated: z.number().optional(),
    code: z.string().nullable().optional(),
    transactionContent: z.string().nullable().optional(),
    referenceNumber: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    orderId: z.string().uuid().nullable().optional(),
    createdAt: z.date(),
});

export const GetTransactionsQuerySchema = z.object({
    page: z.number().min(1).optional().default(1),
    limit: z.number().min(1).max(100).optional().default(20),
    gateway: z.string().optional(),
    orderId: z.string().uuid().optional(),
});

export const GetTransactionsResSchema = z.object({
    items: z.array(PaymentTransactionSchema),
    total: z.number(),
});

export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;
export type GetTransactionsQueryType = z.infer<
    typeof GetTransactionsQuerySchema
>;
export type GetTransactionsResType = z.infer<typeof GetTransactionsResSchema>;
