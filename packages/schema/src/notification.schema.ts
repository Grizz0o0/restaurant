import { z } from 'zod';

export const SendPushNotificationSchema = z.object({
    userId: z.string().uuid(),
    title: z.string().min(1),
    body: z.string().min(1),
    data: z.record(z.string(), z.any()).optional(),
});

export type SendPushNotificationType = z.infer<
    typeof SendPushNotificationSchema
>;

export const NotificationSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    type: z.enum(['ORDER_UPDATE', 'PROMOTION', 'LOW_STOCK', 'RECOMMENDATION', 'CONTACT']),
    isRead: z.boolean().default(false),
    createdAt: z.date(),
    data: z.any().optional(),
});

export type NotificationType = z.infer<typeof NotificationSchema>;

export const MarkAsReadSchema = z.object({
    id: z.string().uuid().optional(), // If null/undefined, mark all as read
});

export type MarkAsReadType = z.infer<typeof MarkAsReadSchema>;
