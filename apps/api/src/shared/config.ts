import z from 'zod'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
// Kiểm tra đã có file .env chưa

dotenv.config()

if (!fs.existsSync('.env')) {
  console.log('Không tìm thấy file .env')
  process.exit(1)
}

const configSchema = z.object({
  // ===== Database =====
  DATABASE_URL: z.string().url(),
  DATABASE_URL_POOL_MAX: z.coerce.number().positive(),

  // ===== App =====
  APP_NAME: z.string().min(1),
  APP_DESCRIPTION: z.string(),
  APP_PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // ===== Auth =====
  AUTH_ACCESS_TOKEN_SECRET: z.string().min(10),
  AUTH_REFRESH_TOKEN_SECRET: z.string().min(10),
  AUTH_ACCESS_TOKEN_EXPIRES_IN: z.string(),
  AUTH_REFRESH_TOKEN_EXPIRES_IN: z.string(),

  // ===== Admin seed =====
  ADMIN_NAME: z.string(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),
  ADMIN_PHONE_NUMBER: z.string(),

  // ===== OTP & Email =====
  OTP_EXPIRES_IN: z.string(),
  RESEND_API_KEY: z.string(),

  // ===== Google OAuth =====
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string().url(),

  // ===== Cloudinary =====
  CLOUD_NAME: z.string(),
  CLOUD_API_KEY: z.string(),
  CLOUD_API_SECRET: z.string(),
  CLOUD_URL: z.string().url(),

  // ===== Firebase =====
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),

  // ===== Throttle =====
  THROTTLE_TTL: z.coerce.number().positive(),
  THROTTLE_LIMIT: z.coerce.number().positive(),

  // ===== Other =====
  SECRET_API_KEY: z.string(),
  JWT_SECRET: z.string(),
  FRONTEND_URL: z.string().url(),

  // ===== MoMo =====
  MOMO_PARTNER_CODE: z.string(),
  MOMO_ACCESS_KEY: z.string(),
  MOMO_SECRET_KEY: z.string(),
  MOMO_IPN_URL: z.string().url(),
  MOMO_REDIRECT_URL: z.string().url(),
  MOMO_ENDPOINT: z.string().url(),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.error('Lỗi validate .env:', JSON.stringify(configServer.error.format(), null, 2))
  console.log('Các giá trị khai báo trong file .env không hợp lệ')
  process.exit(1)
}

const envConfig = configServer.data
export default envConfig
