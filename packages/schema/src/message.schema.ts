import { z } from 'zod';

export const MessageSchema = z.object({
    id: z.string().uuid(),
    fromUserId: z.string().uuid(),
    toUserId: z.string().uuid(),
    content: z.string().min(1, 'Message cannot be empty'),
    readAt: z.date().nullable().optional(),
    createdAt: z.date(),
});

export const SendMessageBodySchema = z.object({
    toUserId: z.string().uuid(),
    content: z.string().min(1, 'Message cannot be empty'),
});

export const GetHistoryParamsSchema = z.object({
    userId: z.string().uuid(), // The ID of the other person in the chat
    cursor: z.string().optional(), // For cursor-based pagination
    limit: z.number().min(1).max(100).optional().default(20),
});

export const GetHistoryResSchema = z.object({
    messages: z.array(MessageSchema),
    nextCursor: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
export type SendMessageBodyType = z.infer<typeof SendMessageBodySchema>;
export type GetHistoryParamsType = z.infer<typeof GetHistoryParamsSchema>;
export type GetHistoryResType = z.infer<typeof GetHistoryResSchema>;
