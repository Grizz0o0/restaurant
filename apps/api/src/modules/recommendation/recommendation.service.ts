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
        basePrice: true,
        images: true,
        dishTranslations: {
          select: {
            name: true,
            description: true,
            languageId: true,
          },
        },
      },
    })

    // If still empty, return fallback
    if (recommendations.length === 0) {
      return this.getFallbackRecommendations(limit)
    }

    return {
      items: recommendations.map((r, i) => {
        const translation =
          r.dishTranslations.find((t: any) => t.languageId === 'vi') || r.dishTranslations[0]

        // Rule-based score: High baseline for personalized recommendations, decaying slowly
        const score = Number((0.95 - (i / Math.max(recommendations.length, 1)) * 0.2).toFixed(2))

        return {
          id: r.id,
          name: translation?.name || 'Món ăn không tên',
          description: translation?.description || '',
          basePrice: Number(r.basePrice || 0),
          images: r.images || [],
          score,
          reason: '✨ Gợi ý riêng cho bạn',
        }
      }),
    }
  }

  private async getFallbackRecommendations(limit: number) {
    // Basic fallback to newest active dishes to break recursive loops
    const dishes = await this.prisma.dish.findMany({
      take: limit,
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        basePrice: true,
        images: true,
        dishTranslations: {
          select: {
            name: true,
            description: true,
            languageId: true,
          },
        },
      },
    })

    return {
      items: dishes.map((d, i) => {
        const translation =
          d.dishTranslations.find((t: any) => t.languageId === 'vi') || d.dishTranslations[0]

        // Rule-based score: decreasing progressively based on index
        const score = Number((0.8 - (i / Math.max(dishes.length, 1)) * 0.3).toFixed(2))

        return {
          id: d.id,
          name: translation?.name || 'Món ăn không tên',
          description: translation?.description || '',
          basePrice: Number(d.basePrice || 0),
          images: d.images || [],
          score,
          reason: '✨ Món mới đáng thử',
        }
      }),
    }
  }

  async getTopSelling(query: GetRecommendationsQueryType) {
    const { limit } = query

    // Aggregating top sold dishes over completed orders
    const topSoldDishes = await this.prisma.dishSKUSnapshot.groupBy({
      by: ['dishId'],
      where: {
        order: {
          status: 'COMPLETED',
        },
        dishId: { not: null },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    })

    const dishIds = topSoldDishes.map((t) => t.dishId!).filter(Boolean)

    if (dishIds.length === 0) {
      return this.getFallbackRecommendations(limit)
    }

    const dishes = await this.prisma.dish.findMany({
      where: {
        id: { in: dishIds },
      },
      select: {
        id: true,
        basePrice: true,
        images: true,
        dishTranslations: {
          select: {
            name: true,
            description: true,
            languageId: true,
          },
        },
      },
    })

    // Create a map to keep the sorting order from the aggregation
    const dishMap = new Map(dishes.map((d) => [d.id, d]))

    // Map the results back to the ordered array, calculate scores
    const items = topSoldDishes
      .map((soldData, index) => {
        const d = dishMap.get(soldData.dishId!)
        if (!d) return null

        const translation =
          d.dishTranslations?.find((t: any) => t.languageId === 'vi') || d.dishTranslations?.[0]

        // Rule-based score for top selling: baseline based on popularity rank
        const score = Number((1.0 - (index / Math.max(topSoldDishes.length, 1)) * 0.4).toFixed(2))

        return {
          id: d.id,
          name: translation?.name || 'Món ăn không tên',
          description: translation?.description || '',
          basePrice: Number(d.basePrice || 0),
          images: d.images || [],
          score,
          reason: `🔥 Đã bán ${soldData._sum.quantity || 0}`,
        }
      })
      .filter((item) => item !== null) as any[]

    return { items }
  }
}
