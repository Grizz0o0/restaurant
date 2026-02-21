import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { LogInteractionBodyType, TopDishesQueryType } from '@repo/schema'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async logInteraction(userId: string | undefined, data: LogInteractionBodyType) {
    return this.prisma.userInteraction.create({
      data: {
        userId,
        dishId: data.dishId,
        action: data.action,
        metadata: data.metadata || null,
      },
    })
  }

  async getTopDishes(query: TopDishesQueryType) {
    const { limit, action } = query

    const topDishes = await this.prisma.userInteraction.groupBy({
      by: ['dishId'],
      _count: {
        dishId: true,
      },
      where: {
        action: action,
        dishId: { not: null },
      },
      orderBy: {
        _count: {
          dishId: 'desc',
        },
      },
      take: limit,
    })

    return {
      items: topDishes.map((t) => ({
        dishId: t.dishId!,
        interactionCount: t._count.dishId,
      })),
    }
  }
}
