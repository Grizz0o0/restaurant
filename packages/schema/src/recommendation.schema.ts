import { z } from 'zod';

export const GetRecommendationsQuerySchema = z.object({
    limit: z.number().min(1).max(20).optional().default(5),
});

export const RecommendationItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    basePrice: z.any(), // Handle raw decimal or parsed number downstream
    images: z.array(z.string()),
    score: z.number().optional(),
    reason: z.string().optional(),
});

export const RecommendationResSchema = z.object({
    items: z.array(RecommendationItemSchema),
});

export type GetRecommendationsQueryType = z.infer<
    typeof GetRecommendationsQuerySchema
>;
export type RecommendationItemType = z.infer<typeof RecommendationItemSchema>;
export type RecommendationResType = z.infer<typeof RecommendationResSchema>;
