import { z } from 'zod';

export const InteractionTypeSchema = z.enum([
    'VIEW',
    'CLICK',
    'SEARCH',
    'ADD_CART',
    'ORDER',
    'REVIEW',
]);

export const LogInteractionBodySchema = z.object({
    action: InteractionTypeSchema,
    dishId: z.string().uuid().optional(),
    metadata: z.any().optional(), // Used for search keywords or context
});

export const TopDishesQuerySchema = z.object({
    limit: z.number().min(1).max(50).optional().default(10),
    action: InteractionTypeSchema.optional().default('VIEW'), // Defaults to getting top viewed dishes
});

export const TopDishItemResSchema = z.object({
    dishId: z.string().uuid(),
    interactionCount: z.number(),
});

export const TopDishesResSchema = z.object({
    items: z.array(TopDishItemResSchema),
});

export type LogInteractionBodyType = z.infer<typeof LogInteractionBodySchema>;
export type TopDishesQueryType = z.infer<typeof TopDishesQuerySchema>;
export type TopDishesResType = z.infer<typeof TopDishesResSchema>;
