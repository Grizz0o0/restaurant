import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateLanguageBodySchema,
  UpdateLanguageBodySchema,
  GetLanguagesQuerySchema,
  LanguageResponseSchema,
} from '@repo/schema'
import { LanguageService } from './language.service'
import { z } from 'zod'

@Injectable()
export class LanguageRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly languageService: LanguageService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot, adminProcedure: admin } = this.trpcService
    return t.router({
      list: prot
        .input(GetLanguagesQuerySchema)
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.languageService.list(input)
          return result
        }),

      detail: prot
        .input(z.object({ id: z.string() }))
        .output(LanguageResponseSchema.nullable())
        .query(async ({ input }) => {
          const result = await this.languageService.findById(input.id)
          return result
        }),

      create: admin
        .input(CreateLanguageBodySchema)
        .output(LanguageResponseSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.languageService.create({
            ...input,
            createdById: ctx.user!.userId,
          })
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdateLanguageBodySchema }))
        .output(LanguageResponseSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.languageService.update(input.id, input.data, ctx.user!.userId)
          return result
        }),

      delete: admin
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const result = await this.languageService.delete(input.id, ctx.user!.userId)
          return result
        }),
    })
  }
}
