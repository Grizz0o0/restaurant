import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { RedisService } from '@/shared/services/redis.service'
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(data: CreateRestaurantBodyType & { createdById: string }) {
    const created = await this.prisma.restaurant.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    await this.redisService.delByPattern('restaurant:*')
    return created
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

    const updated = await this.prisma.restaurant.update({
      where: { id },
      data,
    })
    await this.redisService.delByPattern('restaurant:*')
    return updated
  }

  async findById(id: string) {
    const cacheKey = `restaurant:${id}`
    const cached = await this.redisService.get<any>(cacheKey)
    if (cached) return cached

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

    await this.redisService.set(cacheKey, restaurant, 600)
    return restaurant
  }

  async getMain() {
    const cacheKey = 'restaurant:main'
    const cached = await this.redisService.get<any>(cacheKey)
    if (cached) return cached

    const restaurant = await this.prisma.restaurant.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!restaurant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Restaurant not found',
      })
    }

    await this.redisService.set(cacheKey, restaurant, 600)
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
    const deleted = await this.prisma.restaurant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    })
    await this.redisService.delByPattern('restaurant:*')
    return deleted
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

    let result
    if (existing) {
      result = await this.prisma.restaurantStaff.update({
        where: {
          restaurantId_userId: { restaurantId, userId },
        },
        data: { position },
      })
    } else {
      result = await this.prisma.restaurantStaff.create({
        data: {
          restaurantId,
          userId,
          position,
        },
      })
    }

    await this.redisService.delByPattern('restaurant:*')
    return result
  }

  async removeStaff(data: RemoveStaffBodyType) {
    const { restaurantId, userId } = data

    const removed = await this.prisma.restaurantStaff.delete({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    })
    await this.redisService.delByPattern('restaurant:*')
    return removed
  }
}
