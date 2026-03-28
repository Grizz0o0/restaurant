import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import {
  CreateRestaurantBodyType,
  UpdateRestaurantBodyType,
  GetRestaurantsQueryType,
  AssignStaffBodyType,
  RemoveStaffBodyType,
} from '@repo/schema'
import { TRPCError } from '@trpc/server'

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRestaurantBodyType & { createdById: string }) {
    return this.prisma.restaurant.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async update(id: string, data: UpdateRestaurantBodyType & { updatedById: string }) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    })

    if (!restaurant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Restaurant not found',
      })
    }

    return this.prisma.restaurant.update({
      where: { id },
      data,
    })
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    })

    if (!restaurant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Restaurant not found',
      })
    }

    return restaurant
  }

  async getMain() {
    const restaurant = await this.prisma.restaurant.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!restaurant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Restaurant not found',
      })
    }

    return restaurant
  }

  async list(input: GetRestaurantsQueryType) {
    const { page = 1, limit = 10, search } = input
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ])

    return { items, total }
  }

  async delete(id: string, deletedById: string) {
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    })
  }

  async assignStaff(data: AssignStaffBodyType) {
    const { restaurantId, userId, position } = data


    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
    }


    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Restaurant not found' })
    }


    const existing = await this.prisma.restaurantStaff.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    })

    if (existing) {
      // Update position if already exists
      return this.prisma.restaurantStaff.update({
        where: {
          restaurantId_userId: { restaurantId, userId },
        },
        data: { position },
      })
    }

    return this.prisma.restaurantStaff.create({
      data: {
        restaurantId,
        userId,
        position,
      },
    })
  }

  async removeStaff(data: RemoveStaffBodyType) {
    const { restaurantId, userId } = data

    return this.prisma.restaurantStaff.delete({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    })
  }
}
