import { z } from 'zod';

export const DishSchema = z.object({
    id: z.string(),
    basePrice: z.preprocess((val) => {
        if (val && typeof val === 'object' && 'toNumber' in val) {
            return (val as any).toNumber();
        }
        return val;
    }, z.number()),
    virtualPrice: z
        .preprocess((val) => {
            if (val && typeof val === 'object' && 'toNumber' in val) {
                return (val as any).toNumber();
            }
            return val;
        }, z.number())
        .nullable()
        .optional(),
    supplierId: z.string(),
    images: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date(),
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean(),
    categories: z
        .array(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                slug: z.string().optional(),
            }),
        )
        .optional(),
    languageId: z.string().optional(),
    dishTranslations: z
        .array(
            z.object({
                languageId: z.string(),
                name: z.string(),
                description: z.string(),
            }),
        )
        .optional(),
});

export type DishType = z.infer<typeof DishSchema>;

export const GetDishesQuerySchema = z.object({
    page: z.number().default(1),
    limit: z.number().default(10),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    supplierId: z.string().optional(),
    isActive: z.boolean().optional(),
});

export type GetDishesQueryType = z.infer<typeof GetDishesQuerySchema>;

export const CreateDishBodySchema = z.object({
    basePrice: z.number(),
    virtualPrice: z.number().default(0),
    supplierId: z.string(),
    images: z.array(z.string()).default([]),
    categoryIds: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    name: z.string(),
    description: z.string(),
    languageId: z.string(),
    translations: z
        .array(
            z.object({
                languageId: z.string(),
                name: z.string(),
                description: z.string(),
            }),
        )
        .optional(),
    variants: z
        .array(
            z.object({
                name: z.string(),
                options: z.array(z.string()), // e.g., ["M", "L"]
            }),
        )
        .optional(),
    skus: z
        .array(
            z.object({
                value: z.string(), // SKU code e.g. "DISH-01-M"
                price: z.number(),
                stock: z.number(),
                images: z.array(z.string()).default([]),
                optionValues: z.array(z.string()), // ["M", "No Ice"] - logic to match options
            }),
        )
        .optional(),
});

export type CreateDishBodyType = z.infer<typeof CreateDishBodySchema>;

export const UpdateDishBodySchema = z.object({
    basePrice: z.number().optional(),
    virtualPrice: z.number().optional(),
    supplierId: z.string().optional(),
    images: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    languageId: z.string().optional(),
    variants: z
        .array(
            z.object({
                id: z.string().optional(), // If present, update; else create
                name: z.string(),
                options: z.array(z.string()),
            }),
        )
        .optional(),
});

export type UpdateDishBodyType = z.infer<typeof UpdateDishBodySchema>;

export const LinkDishCategorySchema = z.object({
    dishId: z.string(),
    categoryId: z.string(),
});

export type LinkDishCategoryType = z.infer<typeof LinkDishCategorySchema>;

export const VariantOptionSchema = z.object({
    id: z.string(),
    value: z.string(),
});

export const VariantSchema = z.object({
    id: z.string(),
    name: z.string(),
    options: z.array(VariantOptionSchema),
});

export const SKUSchema = z.object({
    id: z.string(),
    value: z.string(),
    price: z
        .custom<any>(
            (val) =>
                typeof val === 'object' && val !== null && 'toNumber' in val,
        )
        .transform((v) => v.toNumber())
        .or(z.number()),
    stock: z.number(),
    images: z.array(z.string()),
    variantOptions: z.array(VariantOptionSchema).optional(),
});

export const DishDetailResSchema = DishSchema.extend({
    translations: z
        .array(
            z.object({
                languageId: z.string(),
                name: z.string(),
                description: z.string(),
            }),
        )
        .optional(),
    categories: z
        .array(
            z.object({
                id: z.string(),
            }),
        )
        .optional(),
    variants: z.array(VariantSchema).optional(),
    skus: z.array(SKUSchema).optional(),
    reviews: z.array(
        z.object({
            id: z.string(),
            content: z.string(),
            rating: z.number(),
            createdAt: z.date(),
            user: z.object({
                name: z.string(),
                avatar: z.string().nullable().optional(),
            }),
        })
    ).optional(),
}).nullable();

export type DishDetailResType = z.infer<typeof DishDetailResSchema>;

export const GetDishesResSchema = z.object({
    data: z.array(DishSchema),
    pagination: z.object({
        totalItems: z.number(),
        totalPages: z.number(),
        page: z.number(),
        limit: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

export type GetDishesResType = z.infer<typeof GetDishesResSchema>;
