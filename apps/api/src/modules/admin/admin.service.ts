import { Injectable, NotFoundException } from '@nestjs/common'
import { RoleName, UserStatus } from '@repo/constants'
import { AuthRepository } from '@/modules/auth/auth.repo'
import { SharedUserRepository } from '@/shared/repositories/shared-user.repo'
import { PrismaService } from '@/shared/prisma/prisma.service'

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

  async banUser(userId: string) {
    const user = await this.sharedUserRepository.findUnique({ id: userId })
    if (!user) throw new NotFoundException('User not found')

    // 1. Update user status to BLOCKED through SharedUserRepository if possible, or AuthRepository
    // We need to update status. sharedUserRepository might only have specific generic methods.
    // Let's use authRepository if it has updateUser, or sharedUserRepository update.
    await this.authRepository.updateUser(userId, { status: UserStatus.BLOCKED })

    // 2. Revoke all sessions (Force Logout)
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
    // Also invalidate validation codes if strict

    return { message: 'User has been forced to logout.' }
  }
}
