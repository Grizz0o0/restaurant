import { z } from 'zod';

export const ReviewSchema = z.object({
    id: z.string(),
    content: z.string(),
    rating: z.number().min(1).max(5),
    adminReply: z.string().nullable().optional(),
    dishId: z.string(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type ReviewType = z.infer<typeof ReviewSchema>;

export const ReplyReviewBodySchema = z.object({
    id: z.string(),
    adminReply: z
        .string()
        .min(1, 'Nội dung phản hồi không được trống')
        .max(2000),
});

export type ReplyReviewBodyType = z.infer<typeof ReplyReviewBodySchema>;

export const CreateReviewBodySchema = z.object({
    dishId: z.string(),
    content: z.string().min(1),
    rating: z.number().int().min(1).max(5),
});

export type CreateReviewBodyType = z.infer<typeof CreateReviewBodySchema>;

export const GetReviewsQuerySchema = z.object({
    page: z.number().default(1),
    limit: z.number().default(10),
    dishId: z.string().optional(),
    userId: z.string().optional(),
});

export type GetReviewsQueryType = z.infer<typeof GetReviewsQuerySchema>;

export const ReviewDetailResSchema = ReviewSchema.extend({
    user: z
        .object({
            id: z.string(),
            name: z.string(),
            avatar: z.string().nullable().optional(),
        })
        .optional(),
    dish: z
        .object({
            id: z.string(),
            images: z.array(z.string()),
        })
        .optional(),
});

export type ReviewDetailResType = z.infer<typeof ReviewDetailResSchema>;

export const GetReviewsResSchema = z.object({
    data: z.array(ReviewDetailResSchema),
    pagination: z.object({
        totalItems: z.number(),
        totalPages: z.number(),
        page: z.number(),
        limit: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type GetReviewsResType = z.infer<typeof GetReviewsResSchema>;
