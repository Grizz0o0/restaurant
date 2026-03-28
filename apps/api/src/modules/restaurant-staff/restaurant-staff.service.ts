import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { CreateRestaurantStaffBodyType, UpdateRestaurantStaffBodyType } from '@repo/schema'

@Injectable()
export class RestaurantStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async assignStaff(restaurantId: string, data: CreateRestaurantStaffBodyType) {

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.prisma.restaurantStaff.upsert({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId: data.userId,
        },
      },
      update: {
        position: data.position,
      },
      create: {
        restaurantId,
        userId: data.userId,
        position: data.position,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    })
  }

  async updateStaffPosition(
    restaurantId: string,
    userId: string,
    data: UpdateRestaurantStaffBodyType,
  ) {
    return this.prisma.restaurantStaff.update({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
      data: {
        position: data.position,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    })
  }

  async removeStaff(restaurantId: string, userId: string) {
    return this.prisma.restaurantStaff.delete({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    })
  }

  async getRestaurantStaffs(restaurantId: string) {
    return this.prisma.restaurantStaff.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatar: true,
          },
        },
      },
    })
  }
}
