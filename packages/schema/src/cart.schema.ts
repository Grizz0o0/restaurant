import { z } from 'zod';

export const AddCartItemSchema = z.object({
    skuId: z.string(),
    quantity: z.number().int().positive(),
    note: z.string().optional(),
});

export type AddCartItemType = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
    note: z.string().optional(),
});

export type UpdateCartItemType = z.infer<typeof UpdateCartItemSchema>;

export const RemoveCartItemSchema = z.object({
    itemId: z.string(),
});

export type RemoveCartItemType = z.infer<typeof RemoveCartItemSchema>;

export const CartItemSchema = z.object({
    id: z.string(),
    quantity: z.number(),
    skuId: z.string(),
    note: z.string().nullish(),
    sku: z.object({
        id: z.string(),
        value: z.string(),
        price: z
            .custom<any>(
                (val) =>
                    typeof val === 'object' &&
                    val !== null &&
                    'toNumber' in val,
            )
            .transform((v) => v.toNumber())
            .or(z.number())
            .or(z.string().transform((v) => Number(v))),
        stock: z.number(),
        images: z.array(z.string()),
        dish: z.object({
            id: z.string(),
            name: z.string().optional(), // name comes from translation usually, check Dish structure later
            images: z.array(z.string()),
        }),
    }),
});

export type CartItemType = z.infer<typeof CartItemSchema>;

export const GetCartResSchema = z.object({
    items: z.array(CartItemSchema),
    total: z.number(),
});

export type GetCartResType = z.infer<typeof GetCartResSchema>;
