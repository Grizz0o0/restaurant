import { z } from 'zod';

export const UserPreferenceDataSchema = z.object({
    allergies: z.array(z.string()).optional(),
    spiceLevel: z
        .enum(['NONE', 'MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'])
        .optional(),
    favoriteDishes: z.array(z.string()).optional(),
    favoriteCategories: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

export const UserPreferenceSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    preferences: UserPreferenceDataSchema,
});

export const UpdateUserPreferenceBodySchema = z.object({
    preferences: UserPreferenceDataSchema,
});

export type UserPreferenceData = z.infer<typeof UserPreferenceDataSchema>;
export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type UpdateUserPreferenceBodyType = z.infer<
    typeof UpdateUserPreferenceBodySchema
>;
