import { z } from 'zod';
import { DishSchema } from './dish.schema';

export const OrderItemSchema = z.object({
    id: z.string(),
    dishId: z.string().nullable().optional(),
    dishName: z.string(),
    price: z
        .custom<any>(
            (val) =>
                typeof val === 'object' && val !== null && 'toNumber' in val,
        )
        .transform((v) => v.toNumber())
        .or(z.number()), // Decimal in DB, number in JS
    quantity: z.number().int().positive(),
    images: z.array(z.string()),
    skuValue: z.string().nullable().optional(),
});

export const OrderSchema = z.object({
    id: z.string(),
    tableId: z.string().nullable(),
    guestId: z.string().nullable(),
    status: z.string(),
    totalAmount: z
        .custom<any>(
            (val) =>
                typeof val === 'object' && val !== null && 'toNumber' in val,
        )
        .transform((v) => v.toNumber())
        .or(z.number()), // DB has totalAmount
    discount: z
        .custom<any>(
            (val) =>
                typeof val === 'object' && val !== null && 'toNumber' in val,
        )
        .transform((v) => v.toNumber())
        .or(z.number())
        .optional(), // Added discount
    items: z.array(OrderItemSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type OrderType = z.infer<typeof OrderSchema>;

export const CreateOrderBodySchema = z.object({
    tableId: z.string().optional(), // Can be inferred from Guest Token
    items: z.array(
        z.object({
            dishId: z.string(),
            quantity: z.number().int().positive(),
            note: z.string().optional(),
        }),
    ),
});

export type CreateOrderBodyType = z.infer<typeof CreateOrderBodySchema>;

export const CreateOrderFromCartSchema = z.object({
    promotionCode: z.string().optional(),
    guestInfo: z.any().optional(),
    addressId: z.string().optional(),
});

export type CreateOrderFromCartType = z.infer<typeof CreateOrderFromCartSchema>;

export const UpdateOrderStatusSchema = z.object({
    orderId: z.string(),
    status: z.string(),
});

export type UpdateOrderStatusType = z.infer<typeof UpdateOrderStatusSchema>;

export const GetOrdersQuerySchema = z.object({
    page: z.number().default(1),
    limit: z.number().default(10),
    status: z.string().optional(),
    tableId: z.string().optional(),
    fromDate: z.date().optional(),
    toDate: z.date().optional(),
    userId: z.string().optional(),
});

export type GetOrdersQueryType = z.infer<typeof GetOrdersQuerySchema>;

export const GetOrdersResSchema = z.object({
    data: z.array(OrderSchema),
    pagination: z.object({
        totalItems: z.number(),
        totalPages: z.number(),
        page: z.number(),
        limit: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type GetOrdersResType = z.infer<typeof GetOrdersResSchema>;
