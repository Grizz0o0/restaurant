import { z } from 'zod';

export const GetRecommendationsQuerySchema = z.object({
    limit: z.number().min(1).max(20).optional().default(5),
});

export const RecommendationItemSchema = z.object({
    dishId: z.string().uuid(),
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
