import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_POOL_MAX: z.coerce.number().optional().default(10),

  APP_NAME: z.string().optional().default('restaurant'),
  APP_DESCRIPTION: z.string().optional(),
  APP_PORT: z.coerce.number().optional().default(3052),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().optional(),

  AUTH_ACCESS_TOKEN_SECRET: z.string(),
  AUTH_REFRESH_TOKEN_SECRET: z.string(),
  AUTH_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  AUTH_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  ADMIN_NAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PHONE_NUMBER: z.string().optional(),

  OTP_EXPIRES_IN: z.string().default('5m'),
  RESEND_API_KEY: z.string().optional(),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  CLOUD_NAME: z.string().optional(),
  CLOUD_API_KEY: z.string().optional(),
  CLOUD_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),

  SECRET_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),

  THROTTLE_TTL: z.coerce.number().optional().default(60000),
  THROTTLE_LIMIT: z.coerce.number().optional().default(10),

  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.coerce.number().optional().default(6379),
  REDIS_PASSWORD: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>
