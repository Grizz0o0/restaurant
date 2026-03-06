import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { ReviewRepo } from './review.repo'
import { CreateReviewBodyType, GetReviewsQueryType, ReplyReviewBodyType } from '@repo/schema'

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepo: ReviewRepo) {}

  async create({ data, userId }: { data: CreateReviewBodyType; userId: string }) {
    // Optional: Check if user ordered dish?
    return await this.reviewRepo.create({ data, userId })
  }

  async list(query: GetReviewsQueryType) {
    return await this.reviewRepo.list(query)
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const review = await this.reviewRepo.findById(id)
    if (!review) throw new NotFoundException('Review not found')

    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own reviews')
    }

    return await this.reviewRepo.delete(id)
  }

  async reply(data: ReplyReviewBodyType) {
    const review = await this.reviewRepo.findById(data.id)
    if (!review) throw new NotFoundException('Review not found')
    return await this.reviewRepo.reply({ id: data.id, adminReply: data.adminReply })
  }
}
