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

    // Parallelize queries for performance
    const [
      totalRevenue,
      todaysRevenue,
      totalOrders,
      newOrdersToday,
      totalCustomers,
      activeDishes,
      recentOrders,
    ] = await Promise.all([
      // 1. Total Revenue (Completed orders)
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' },
      }),
      // 2. Today's Revenue
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      // 3. Total Orders
      this.prisma.order.count(),
      // 4. New Orders Today
      this.prisma.order.count({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      // 5. Total Customers
      this.prisma.user.count({
        where: { role: { name: RoleName.Client } },
      }),
      // 6. Active Dishes
      this.prisma.dish.count({
        where: { deletedAt: null },
      }),
      // 7. Recent Orders
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
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
        code: order.id.slice(-6).toUpperCase(), // Simpler short code
        user: order.user?.name || 'Guest',
        itemsSummary: order.items.map((i) => `${i.quantity} x ${i.dishName}`).join(', '),
        totalAmount: Number(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
      })),
    }
  }

  async getReport(input: GetReportQueryType) {
    const { startDate, endDate } = input

    // Adjust endDate to be inclusive (end of that day)
    const endOfDay = new Date(endDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Fetch all completed orders in the range with their items
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endOfDay },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group orders by date
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

    // Aggregate top dishes
    const dishMap = new Map<string, { totalQuantity: number; totalRevenue: number }>()
    for (const order of orders) {
      for (const item of order.items) {
        const existing = dishMap.get(item.dishName) || { totalQuantity: 0, totalRevenue: 0 }
        existing.totalQuantity += item.quantity
        existing.totalRevenue += Number(item.price) * item.quantity
        dishMap.set(item.dishName, existing)
      }
    }

    const topDishes = Array.from(dishMap.entries())
      .map(([dishName, val]) => ({ dishName, ...val }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Fetch review stats for dishes in this period
    const reviewsInPeriod = await this.prisma.review.groupBy({
      by: ['dishId'],
      where: {
        createdAt: { gte: startDate, lte: endOfDay },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })

    // Get dish names for those reviews
    const dishIds = reviewsInPeriod.map((r) => r.dishId)
    const dishesInfo = await this.prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: { id: true, dishTranslations: { select: { name: true } }, basePrice: true },
    })

    // Map data
    const dishReviewScores = reviewsInPeriod.map((r) => {
      const dish = dishesInfo.find((d) => d.id === r.dishId)
      return {
        dishName: dish?.dishTranslations[0]?.name || 'Unknown Dish',
        avgRating: r._avg.rating || 0,
        reviewCount: r._count.rating,
      }
    })

    // Sort for top rated and top criticized
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
