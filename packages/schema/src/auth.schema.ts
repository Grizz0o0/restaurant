import z from 'zod';
import { UserStatus } from '@repo/constants';
import { TypeOfValidationCode } from '@repo/constants';
export { TypeOfValidationCode };

const UserBaseSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    password: z.string(),
    phoneNumber: z.string(),
    avatar: z.string().nullable(),
    totpSecret: z.string().nullable(),
    failedLoginAttempts: z.coerce.number(),
    lockedAt: z.coerce.date().nullable(),
    status: z.nativeEnum(UserStatus),
    roleId: z.string(),
    createdById: z.string().nullable(),
    updatedById: z.string().nullable(),
    deletedById: z.string().nullable(),
    deletedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const UserSchema = UserBaseSchema.extend({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    password: z.string().min(6).max(100),
    phoneNumber: z.string().min(9).max(15),
});

export const UserOutputSchema = UserBaseSchema;
export type UserType = z.infer<typeof UserSchema>;

export const GuestLoginBodySchema = z.object({
    tableId: z.string(),
    token: z.string(),
});
export type GuestLoginBodyType = z.infer<typeof GuestLoginBodySchema>;

export const RegisterBodySchema = UserSchema.pick({
    email: true,
    password: true,
    name: true,
    phoneNumber: true,
})
    .extend({
        confirmPassword: z.string().min(6).max(100),
        code: z.string().length(6),
    })
    .strict()
    .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: 'custom',
                message: 'Mật khẩu và mật khẩu xác nhận phải giống nhau',
                path: ['confirmPassword'],
            });
        }
    });

export const LoginResSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
});

export const RegisterResSchema = LoginResSchema;

export const ValidationCode = z.object({
    id: z.string(),
    email: z.string().email(),
    code: z.string().length(6),
    type: z.nativeEnum(TypeOfValidationCode),
    expiresAt: z.date(),
    createdAt: z.date(),
});

export const SendOTPBodySchema = z
    .object({
        email: z.string().email(),
        type: z.nativeEnum(TypeOfValidationCode),
    })
    .strict();

export const LoginBodySchema = UserSchema.pick({
    email: true,
    password: true,
})
    .extend({
        totpCode: z.string().length(6).optional(),
        code: z.string().length(6).optional(),
    })
    .superRefine(({ totpCode, code }, ctx) => {
        if (totpCode !== undefined && code !== undefined) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'Bạn chỉ nên truyền mã xác thực 2FA hoặc mã OTP. Không được truyền cả 2',
                path: ['totpCode'],
            });
            ctx.addIssue({
                code: 'custom',
                message:
                    'Bạn chỉ nên truyền mã xác thực 2FA hoặc mã OTP. Không được truyền cả 2',
                path: ['code'],
            });
        }
    });

export const DeviceSchema = z.object({
    id: z.string(),
    userId: z.string(),
    userAgent: z.string(),
    ip: z.string(),
    lastActive: z.date(),
    createdAt: z.date(),
    isActive: z.boolean(),
});

export const RefreshTokenSchema = z.object({
    token: z.string(),
    userId: z.string(),
    deviceId: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
});

export const RefreshTokenBodySchema = z
    .object({
        refreshToken: z.string(),
    })
    .strict();

export const RefreshTokenResSchema = LoginResSchema;

export const LogoutBodySchema = RefreshTokenBodySchema;

export const GoogleAuthStateSchema = DeviceSchema.pick({
    userAgent: true,
    ip: true,
});

export const GetAuthorizationUrlResSchema = z.object({
    url: z.string().url(),
});

export const ForgotPasswordBodySchema = z
    .object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6).max(100),
        confirmNewPassword: z.string().min(6).max(100),
    })
    .strict()
    .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
        if (confirmNewPassword !== newPassword) {
            ctx.addIssue({
                code: 'custom',
                message: 'Mật khẩu và mật khẩu xác nhận phải giống nhau',
                path: ['confirmNewPassword'],
            });
        }
    });

export const DisableTwoFactorAuthBodySchema = z
    .object({
        totpCode: z.string().length(6).optional(),
        code: z.string().length(6).optional(),
    })
    .strict()
    .superRefine(({ totpCode, code }, ctx) => {
        // Khi cung cấp cả totpCode và code, hoặc không cung cấp cả totpCode và code
        if ((totpCode !== undefined) === (code !== undefined)) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'Bạn phải cung cấp mã xác thực 2FA hoặc mã OTP. Không được cung cấp cả 2',
                path: ['totpCode'],
            });
            ctx.addIssue({
                code: 'custom',
                message:
                    'Bạn phải cung cấp mã xác thực 2FA hoặc mã OTP. Không được cung cấp cả 2',
                path: ['code'],
            });
        }
    });

export const TwoFactorSetupResSchema = z.object({
    secret: z.string(),
    uri: z.string(),
});

export const GoogleCallbackBodySchema = z.object({
    code: z.string(),
    state: z.string(),
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;
export type ValidationCodeType = z.infer<typeof ValidationCode>;
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>;
export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;
export type DeviceType = z.infer<typeof DeviceSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenResType = LoginResType;
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type LogoutBodyType = RefreshTokenBodyType;
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>;
export type GetAuthorizationUrlResType = z.infer<
    typeof GetAuthorizationUrlResSchema
>;
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;
export type DisableTwoFactorAuthBodyType = z.infer<
    typeof DisableTwoFactorAuthBodySchema
>;
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>;
export type GoogleCallbackBodyType = z.infer<typeof GoogleCallbackBodySchema>;

export const SessionSchema = z.object({
    id: z.string(),
    deviceId: z.string(),
    userAgent: z.string(),
    ip: z.string(),
    lastActive: z.date(),
    expiresAt: z.date(),
    isCurrent: z.boolean(),
});

export const GetSessionsResSchema = z.array(SessionSchema);

export const RevokeSessionBodySchema = z.object({
    id: z.string(),
});

export const RevokeAllSessionsResSchema = z.object({
    message: z.string(),
});

export type SessionType = z.infer<typeof SessionSchema>;
export type GetSessionsResType = z.infer<typeof GetSessionsResSchema>;
export type RevokeSessionBodyType = z.infer<typeof RevokeSessionBodySchema>;

export const ChangePasswordBodySchema = z
    .object({
        oldPassword: z.string().min(1, 'Mật khẩu cũ không được để trống'),
        newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
        confirmNewPassword: z
            .string()
            .min(1, 'Xác nhận mật khẩu không được để trống'),
    })
    .strict()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Mật khẩu mới không khớp',
        path: ['confirmNewPassword'],
    });

export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>;
