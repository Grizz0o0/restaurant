import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import {
  CreateLanguageBodySchema,
  UpdateLanguageBodySchema,
  GetLanguagesQuerySchema,
  LanguageResponseSchema,
  CreateLanguageBodyType,
  UpdateLanguageBodyType,
  GetLanguagesQueryType,
} from '@repo/schema'
import { Context } from '@/trpc/context'
import { LanguageService } from './language.service'
import { z } from 'zod'

@Router({ alias: 'language' })
export class LanguageRouter {
  constructor(private readonly languageService: LanguageService) {}

  @Query({
    input: GetLanguagesQuerySchema,
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware)
  async list(@Input() input: GetLanguagesQueryType) {
    return this.languageService.list(input)
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: LanguageResponseSchema.nullable(),
  })
  @UseMiddlewares(AuthMiddleware)
  async detail(@Input('id') id: string) {
    return this.languageService.findById(id)
  }

  @Mutation({
    input: CreateLanguageBodySchema,
    output: LanguageResponseSchema,
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async create(@Input() input: CreateLanguageBodyType, @Ctx() ctx: Context) {
    return this.languageService.create({ ...input, createdById: ctx.user!.userId })
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: UpdateLanguageBodySchema,
    }),
    output: LanguageResponseSchema,
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async update(@Input() input: { id: string; data: UpdateLanguageBodyType }, @Ctx() ctx: Context) {
    return this.languageService.update(input.id, input.data, ctx.user!.userId)
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async delete(@Input('id') id: string, @Ctx() ctx: Context) {
    return this.languageService.delete(id, ctx.user!.userId)
  }
}
