import { z } from 'zod'

export const AiChatBodySchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.string()),
      }),
    )
    .optional(),
})

export type AiChatBodyType = z.infer<typeof AiChatBodySchema>

export const AiChatResSchema = z.object({
  text: z.string(),
})

export type AiChatResType = z.infer<typeof AiChatResSchema>
