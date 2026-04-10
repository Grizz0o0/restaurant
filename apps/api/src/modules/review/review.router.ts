import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
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

@Injectable()
export class ReviewRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly reviewService: ReviewService,
  ) {}

  get router() {
    const {
      t,
      publicProcedure: pub,
      protectedProcedure: prot,
      adminProcedure: admin,
    } = this.trpcService
    return t.router({
      create: prot
        .input(CreateReviewBodySchema)
        .output(ReviewDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.reviewService.create({ data: input, userId: ctx.user!.userId })
          return result
        }),

      list: pub
        .input(GetReviewsQuerySchema)
        .output(GetReviewsResSchema)
        .query(async ({ input }) => {
          const result = await this.reviewService.list(input)
          return result as any
        }),

      myReviews: prot
        .input(GetReviewsQuerySchema)
        .output(GetReviewsResSchema)
        .query(async ({ input, ctx }) => {
          const result = await this.reviewService.list({ ...input, userId: ctx.user!.userId })
          return result as any
        }),

      delete: prot
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const isAdmin = ctx.user?.roleName === RoleName.Admin
          const result = await this.reviewService.delete(input.id, ctx.user!.userId, isAdmin)
          return result
        }),

      reply: admin
        .input(ReplyReviewBodySchema)
        .output(ReviewDetailResSchema)
        .mutation(async ({ input }) => {
          const result = await this.reviewService.reply(input)
          return result
        }),
    })
  }
}
