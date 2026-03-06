import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { Context } from '@/trpc/context'
import {
  CreateReviewBodySchema,
  ReplyReviewBodySchema,
  GetReviewsQuerySchema,
  GetReviewsResSchema,
  ReviewDetailResSchema,
} from '@repo/schema'
import { ReviewService } from './review.service'
import { z } from 'zod'
import { RoleName } from '@repo/constants'

@Router({ alias: 'review' })
export class ReviewRouter {
  constructor(private readonly reviewService: ReviewService) {}

  @Mutation({
    input: CreateReviewBodySchema,
    output: ReviewDetailResSchema,
  })
  @UseMiddlewares(AuthMiddleware)
  async create(@Input() input: any, @Ctx() ctx: Context) {
    return this.reviewService.create({ data: input, userId: ctx.user!.userId })
  }

  @Query({
    input: GetReviewsQuerySchema,
    output: GetReviewsResSchema,
  })
  async list(@Input() input: any) {
    return this.reviewService.list(input)
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware)
  async delete(@Input('id') id: string, @Ctx() ctx: Context) {
    const isAdmin = ctx.user?.roleName === RoleName.Admin
    return this.reviewService.delete(id, ctx.user!.userId, isAdmin)
  }

  @Mutation({
    input: ReplyReviewBodySchema,
    output: ReviewDetailResSchema,
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async reply(@Input() input: any) {
    return this.reviewService.reply(input)
  }
}
