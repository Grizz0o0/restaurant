import z from 'zod';
import { UserOutputSchema, UserSchema } from './auth.schema';
import { PermissionSchema } from './permission.schema';

// User Translation Schema
const UserTranslationSchema = z.object({
    languageId: z.string(),
    address: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
});

// Profile detail response with role and permissions
export const ProfileDetailResSchema = UserOutputSchema.omit({
    password: true,
    totpSecret: true,
}).extend({
    role: z
        .object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            permissions: z
                .array(
                    PermissionSchema.pick({
                        id: true,
                        name: true,
                        method: true,
                        path: true,
                        module: true,
                    }),
                )
                .optional(),
        })
        .optional(),
    translations: z.array(UserTranslationSchema).optional(),
});

// Update profile body schema
export const UpdateProfileBodySchema = UserSchema.pick({
    name: true,
    phoneNumber: true,
})
    .extend({
        avatar: z.string().optional(),
        translations: z.array(UserTranslationSchema).optional(),
    })
    .partial()
    .strict();

// Types
export type ProfileDetailResType = z.infer<typeof ProfileDetailResSchema>;
export type UpdateProfileBodyType = z.infer<typeof UpdateProfileBodySchema>;
export type UserTranslationType = z.infer<typeof UserTranslationSchema>;
