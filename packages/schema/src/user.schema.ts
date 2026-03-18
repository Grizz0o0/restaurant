import z from 'zod';
import { UserSchema, UserOutputSchema } from './auth.schema';

// Query schemas
export const GetUsersQuerySchema = z
    .object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
        roleId: z.string().optional(),
        status: z.string().optional(),
    })
    .strict();

export const GetUserDetailParamsSchema = z.object({
    userId: z.string(),
});

// Response schemas
export const UserDetailResSchema = UserOutputSchema.omit({
    password: true,
    totpSecret: true,
}).extend({
    role: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
    }),
});

export const GetUsersResSchema = z.object({
    data: z.array(UserDetailResSchema),
    pagination: z.object({
        totalItems: z.number(),
        totalPages: z.number(),
        page: z.number(),
        limit: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});

// Create/Update schemas
export const CreateUserBodySchema = UserSchema.pick({
    email: true,
    password: true,
    name: true,
    phoneNumber: true,
    roleId: true,
})
    .extend({
        avatar: z.string().optional(),
        status: UserSchema.shape.status.optional(),
    })
    .strict();

export const UpdateUserBodySchema = UserSchema.pick({
    email: true,
    name: true,
    phoneNumber: true,
    roleId: true,
    status: true,
})
    .extend({
        avatar: z.string().optional(),
    })
    .partial()
    .strict();

// Types
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>;
export type GetUsersResType = z.infer<typeof GetUsersResSchema>;
export type GetUserDetailParamsType = z.infer<typeof GetUserDetailParamsSchema>;
export type UserDetailResType = z.infer<typeof UserDetailResSchema>;
export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>;
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>;
