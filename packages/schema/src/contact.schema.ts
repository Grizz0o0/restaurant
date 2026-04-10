import { z } from 'zod';

export const ContactMessageSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(500),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().optional().nullable(),
    message: z.string().min(5, 'Nội dung phải có ít nhất 5 ký tự'),
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).default('UNREAD'),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const CreateContactBodySchema = ContactMessageSchema.pick({
    name: true,
    email: true,
    phone: true,
    message: true,
}).strict();

export const GetContactsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
}).strict();

export const GetContactsResSchema = z.object({
    data: z.array(ContactMessageSchema),
    pagination: z.object({
        totalItems: z.number(),
        totalPages: z.number(),
        page: z.number(),
        limit: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type ContactMessageType = z.infer<typeof ContactMessageSchema>;
export type CreateContactBodyType = z.infer<typeof CreateContactBodySchema>;
export type GetContactsQueryType = z.infer<typeof GetContactsQuerySchema>;
export type GetContactsResType = z.infer<typeof GetContactsResSchema>;
