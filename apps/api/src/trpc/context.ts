import { Request, Response } from 'express'
import { AccessTokenPayload } from '@/shared/types/jwt.payload'
import { REQUEST_USER_KEY } from '@repo/constants'

export function createContext({ req, res }: { req: Request; res: Response }) {
  const user = (req as any)[REQUEST_USER_KEY] as AccessTokenPayload | undefined
  return { req, res, user }
}

export type Context = ReturnType<typeof createContext>
