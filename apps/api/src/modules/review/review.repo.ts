import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'
import { CreateReviewBodyType, GetReviewsQueryType } from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'

@Injectable()
export class ReviewRepo {
  constructor(private readonly prisma: PrismaService) {}

  create({ data, userId }: { data: CreateReviewBodyType; userId: string }) {
    return this.prisma.review.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        dish: {
          select: {
            id: true,
            images: true,
            dishTranslations: { select: { name: true }, take: 1 },
          },
        },
      },
    })
  }

  async list(query: GetReviewsQueryType) {
    const { page, limit, dishId, userId } = query

    const where = {
      ...(dishId && { dishId }),
      ...(userId && { userId }),
    }

    return await paginate(
      this.prisma.review,
      {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          dish: {
            select: {
              id: true,
              images: true,
              dishTranslations: { select: { name: true }, take: 1 },
            },
          },
        },
      },
      { page, limit },
    )
  }

  async reply({ id, adminReply }: { id: string; adminReply: string }) {
    return this.prisma.review.update({
      where: { id },
      data: { adminReply },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        dish: {
          select: {
            id: true,
            images: true,
            dishTranslations: { select: { name: true }, take: 1 },
          },
        },
      },
    })
  }

  async delete(id: string) {
    return this.prisma.review.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
    })
  }
}
