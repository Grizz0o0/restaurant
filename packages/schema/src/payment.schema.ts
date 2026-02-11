import { z } from 'zod';

export const InitiatePaymentInputSchema = z.object({
    orderId: z.string(),
});

export const InitiatePaymentOutputSchema = z.object({
    payUrl: z.string().url(),
    deeplink: z.string().optional(),
});

export const CheckPaymentStatusInputSchema = z.object({
    orderId: z.string(),
});

export const CheckPaymentStatusOutputSchema = z.object({
    status: z.string(),
    message: z.string(),
    resultCode: z.number(),
});

export const RefundPaymentInputSchema = z.object({
    orderId: z.string(),
});

export const RefundPaymentOutputSchema = z.object({
    status: z.string(),
    message: z.string(),
    resultCode: z.number(),
    transId: z.number().optional(),
});

export type InitiatePaymentInputType = z.infer<
    typeof InitiatePaymentInputSchema
>;
export type InitiatePaymentOutputType = z.infer<
    typeof InitiatePaymentOutputSchema
>;
export type CheckPaymentStatusInputType = z.infer<
    typeof CheckPaymentStatusInputSchema
>;
export type CheckPaymentStatusOutputType = z.infer<
    typeof CheckPaymentStatusOutputSchema
>;
export type RefundPaymentInputType = z.infer<typeof RefundPaymentInputSchema>;
export type RefundPaymentOutputType = z.infer<typeof RefundPaymentOutputSchema>;
