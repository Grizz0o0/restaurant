import { z } from 'zod';

export const GetInventoriesQuerySchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(1000).optional().default(20),
});

export type GetInventoriesQueryType = z.infer<typeof GetInventoriesQuerySchema>;

export const CreateInventoryBodySchema = z.object({
    restaurantId: z.string().uuid(),
    supplierId: z.string().uuid().optional(),
    itemName: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.string().min(1),
    threshold: z.number().min(0).optional(),
});

export type CreateInventoryBodyType = z.infer<typeof CreateInventoryBodySchema>;

export const UpdateInventoryBodySchema = CreateInventoryBodySchema
    .partial()
    .omit({ restaurantId: true });

export type UpdateInventoryBodyType = z.infer<typeof UpdateInventoryBodySchema>;

export const LinkDishBodySchema = z.object({
    inventoryId: z.string().uuid(),
    dishId: z.string().uuid(),
    quantityUsed: z.number().min(0),
});

export type LinkDishBodyType = z.infer<typeof LinkDishBodySchema>;

export const GetInventoryTransactionsQuerySchema = z.object({
    inventoryId: z.string().uuid().optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(1000).optional().default(20),
});

export type GetInventoryTransactionsQueryType = z.infer<
    typeof GetInventoryTransactionsQuerySchema
>;

