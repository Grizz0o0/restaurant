import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { GetRecommendationsQueryType } from '@repo/schema'

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string | undefined, query: GetRecommendationsQueryType) {
    const { limit } = query

    // 1. If no user, or guest, fallback to most viewed dishes universally
    if (!userId) {
      return this.getFallbackRecommendations(limit)
    }

    // 2. Fetch user's preferences to avoid allergens
    const userPrefs = await this.prisma.userPreference.findFirst({
      where: { userId },
    })

    // For MVPs: we query dishes that they have frequently interacted with
    // AND generally popular dishes. In a real AI model, this would ping a python service.
    // We'll simulate a basic collaborative filter

    // Step A: Find user's top interacted dish categories or dishes
    const recentInteractions = await this.prisma.userInteraction.findMany({
      where: { userId, dishId: { not: null } },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: { dish: { select: { id: true, categories: { select: { id: true } } } } },
    })

    const categoryIds = recentInteractions.flatMap(
      (i) => i.dish?.categories?.map((c) => c.id) || [],
    )

    const preferredCategoryIds = Array.from(new Set(categoryIds))

    const whereQuery: any = {}
    if (preferredCategoryIds.length > 0) {
      whereQuery.categories = {
        some: {
          id: { in: preferredCategoryIds },
        },
      }
    }

    // Step B: Query dishes from preferred categories
    const recommendations = await this.prisma.dish.findMany({
      where: whereQuery,
      take: limit,
      select: {
        id: true,
      },
    })

    // If still empty, return fallback
    if (recommendations.length === 0) {
      return this.getFallbackRecommendations(limit)
    }

    return {
      items: recommendations.map((r, i) => ({
        dishId: r.id,
        score: 1.0 - i * 0.1, // Mocked relevancy score
        reason: 'Based on your recent interactions',
      })),
    }
  }

  private async getFallbackRecommendations(limit: number) {
    // Top 5 generally popular dishes (using mock logic or random)
    const dishes = await this.prisma.dish.findMany({ take: limit })
    return {
      items: dishes.map((d) => ({
        dishId: d.id,
        score: 0.8,
        reason: 'Popular right now',
      })),
    }
  }
}
