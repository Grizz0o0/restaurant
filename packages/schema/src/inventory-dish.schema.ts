import { z } from 'zod';

export const InventoryDishSchema = z.object({
    inventoryId: z.string().uuid(),
    dishId: z.string().uuid(),
    quantityUsed: z.number().positive(),
});

export const CreateInventoryDishBodySchema = z.object({
    inventoryId: z.string().uuid(),
    dishId: z.string().uuid(),
    quantityUsed: z.number().positive(),
});

export const UpdateInventoryDishBodySchema = z.object({
    quantityUsed: z.number().positive(),
});

export const GetInventoryDishParamsSchema = z.object({
    inventoryId: z.string().uuid(),
    dishId: z.string().uuid(),
});

export const GetDishIngredientsResSchema = z.object({
    data: z.array(
        InventoryDishSchema.extend({
            inventory: z
                .object({
                    itemName: z.string(),
                    unit: z.string(),
                    quantity: z.number(),
                })
                .optional(),
        }),
    ),
});

export type InventoryDish = z.infer<typeof InventoryDishSchema>;
export type CreateInventoryDishBodyType = z.infer<
    typeof CreateInventoryDishBodySchema
>;
export type UpdateInventoryDishBodyType = z.infer<
    typeof UpdateInventoryDishBodySchema
>;
export type GetInventoryDishParamsType = z.infer<
    typeof GetInventoryDishParamsSchema
>;
export type GetDishIngredientsResType = z.infer<
    typeof GetDishIngredientsResSchema
>;
