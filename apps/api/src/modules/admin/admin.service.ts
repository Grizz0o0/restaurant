import { Injectable, NotFoundException } from '@nestjs/common'
import { RoleName, UserStatus } from '@repo/constants'
import { AuthRepository } from '@/modules/auth/auth.repo'
import { SharedUserRepository } from '@/shared/repositories/shared-user.repo'
import { PrismaService } from '@/shared/prisma/prisma.service'
import type { GetReportQueryType } from '@repo/schema'

@Injectable()
export class AdminService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboardStats() {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)


    const [
      totalRevenue,
      todaysRevenue,
      totalOrders,
      newOrdersToday,
      totalCustomers,
      activeDishes,
      recentOrders,
    ] = await Promise.all([

      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' },
      }),

      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      }),

      this.prisma.order.count(),

      this.prisma.order.count({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      }),

      this.prisma.user.count({
        where: { role: { name: RoleName.Client } },
      }),

      this.prisma.dish.count({
        where: { deletedAt: null },
      }),

      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              dish: {
                include: {
                  dishTranslations: {
                    where: { languageId: 'vi' },
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ])

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      todaysRevenue: Number(todaysRevenue._sum.totalAmount || 0),
      totalOrders,
      newOrdersToday,
      totalCustomers,
      activeDishes,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,

        code: order.id.slice(-6).toUpperCase(),
        user: order.user?.name || 'Guest',
        itemsSummary: order.items
          .map((i) => {
            const viName = (i.dish as any)?.dishTranslations?.[0]?.name
            return `${i.quantity} x ${viName || i.dishName}`
          })
          .join(', '),
        totalAmount: Number(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
      })),
    }
  }

  async getReport(input: GetReportQueryType) {
    const { startDate, endDate } = input


    const endOfDay = new Date(endDate)
    endOfDay.setHours(23, 59, 59, 999)


    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endOfDay },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })


    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 }
      existing.revenue += Number(order.totalAmount)
      existing.orders += 1
      dailyMap.set(dateKey, existing)
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      orders: val.orders,
    }))


    const dishMap = new Map<
      string,
      { dishId?: string; dishName: string; totalQuantity: number; totalRevenue: number }
    >()
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.dishId || item.dishName
        const existing = dishMap.get(key) || {
          dishId: item.dishId || undefined,
          dishName: item.dishName,
          totalQuantity: 0,
          totalRevenue: 0,
        }
        existing.totalQuantity += item.quantity
        existing.totalRevenue += Number(item.price) * item.quantity
        dishMap.set(key, existing)
      }
    }

    const topDishesRaw = Array.from(dishMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    )

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0


    const reviewsInPeriod = await this.prisma.review.groupBy({
      by: ['dishId'],
      where: {
        createdAt: { gte: startDate, lte: endOfDay },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })


    const reviewDishIds = reviewsInPeriod.map((r) => r.dishId)
    const topDishesIds = topDishesRaw.map((d) => d.dishId).filter(Boolean) as string[]
    const dishIds = Array.from(new Set([...reviewDishIds, ...topDishesIds]))

    const dishesInfo = await this.prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: {
        id: true,
        dishTranslations: {
          where: { languageId: 'vi' },
          select: { name: true },
        },
        basePrice: true,
      },
    })


    const dishReviewScores = reviewsInPeriod.map((r) => {
      const dish = dishesInfo.find((d) => d.id === r.dishId)
      return {
        dishName: dish?.dishTranslations[0]?.name || 'Unknown Dish',
        avgRating: r._avg.rating || 0,
        reviewCount: r._count.rating,
      }
    })


    const missingDishNames = topDishesRaw.filter((d) => !d.dishId).map((d) => d.dishName)
    const fallbackMap = new Map<string, string>()

    if (missingDishNames.length > 0) {
      const dishesWithMissingNames = await this.prisma.dish.findMany({
        where: {
          dishTranslations: {
            some: {
              name: { in: missingDishNames },
            },
          },
        },
        select: {
          dishTranslations: {
            select: { languageId: true, name: true },
          },
        },
      })

      for (const dish of dishesWithMissingNames) {
        const viTranslation = dish.dishTranslations.find((t) => t.languageId === 'vi')
        if (viTranslation) {
          for (const t of dish.dishTranslations) {
            fallbackMap.set(t.name, viTranslation.name)
          }
        }
      }
    }


    const topDishes = topDishesRaw.map((d) => {
      let finalName = d.dishName
      if (d.dishId) {
        const dishInfo = dishesInfo.find((info) => info.id === d.dishId)
        if (dishInfo && dishInfo.dishTranslations[0]) {
          finalName = dishInfo.dishTranslations[0].name
        }
      } else if (fallbackMap.has(d.dishName)) {
        finalName = fallbackMap.get(d.dishName)!
      }
      return {
        dishName: finalName,
        totalQuantity: d.totalQuantity,
        totalRevenue: d.totalRevenue,
      }
    })


    const topRatedDishes = [...dishReviewScores]
      .filter((r) => r.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
      .slice(0, 5)

    const topCriticizedDishes = [...dishReviewScores]
      .filter((r) => r.reviewCount > 0)
      .sort((a, b) => a.avgRating - b.avgRating || b.reviewCount - a.reviewCount)
      .slice(0, 5)

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      dailyRevenue,
      topDishes,
      topRatedDishes,
      topCriticizedDishes,
    }
  }

  async banUser(userId: string) {
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    await this.authRepository.updateUser(userId, { status: UserStatus.BLOCKED })
    await this.authRepository.deleteManyRefreshToken({ userId })

    return { message: 'User has been banned and logged out.' }
  }

  async unbanUser(userId: string) {
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    await this.authRepository.updateUser(userId, {
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockedAt: null,
    })

    return { message: 'User has been unbanned.' }
  }

  async forceLogout(userId: string) {
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    await this.authRepository.deleteManyRefreshToken({ userId })

    return { message: 'User has been forced to logout.' }
  }
}
