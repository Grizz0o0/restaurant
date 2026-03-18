import { z } from 'zod';

export const GetSuppliersQuerySchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(1000).optional().default(20),
});

export type GetSuppliersQueryType = z.infer<typeof GetSuppliersQuerySchema>;

export const CreateSupplierBodySchema = z.object({
    name: z.string().min(1),
    logo: z.string().optional(),
    contactName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    rating: z.number().min(0).max(5).optional(),
    translations: z
        .array(
            z.object({
                languageId: z.string(),
                description: z.string().optional(),
            }),
        )
        .optional(),
});

export type CreateSupplierBodyType = z.infer<typeof CreateSupplierBodySchema>;

export const UpdateSupplierBodySchema = CreateSupplierBodySchema.partial();

export type UpdateSupplierBodyType = z.infer<typeof UpdateSupplierBodySchema>;
