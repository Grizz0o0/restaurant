import { Injectable, NotFoundException } from '@nestjs/common'
import { TableRepo } from './table.repo'
import {
  CreateTableBodyType,
  UpdateTableBodyType,
  GetTablesQueryType,
  RestaurantTableType,
} from '@repo/schema'
import { v4 as uuidv4 } from 'uuid'
import envConfig from '@/shared/config'
import { PrismaService } from '@/shared/prisma'
import { RedisService } from '@/shared/services/redis.service'

@Injectable()
export class TableService {
  constructor(
    private readonly tableRepo: TableRepo,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(data: CreateTableBodyType & { createdById: string }) {
    const qrCode = data.qrCode || uuidv4().split('-')[0].toUpperCase()

    let restaurant = await this.prismaService.restaurant.findFirst()
    if (!restaurant) {
      restaurant = await this.prismaService.restaurant.create({
        data: {
          name: 'Default Restaurant',
          address: 'Default Address',
          createdById: data.createdById,
        },
      })
    }

    const created = await this.tableRepo.create({
      ...data,
      restaurantId: restaurant.id,
      qrCode,
    })

    await this.redisService.delByPattern('table:*')
    return created
  }

  async update(id: string, data: UpdateTableBodyType & { updatedById: string }) {
    await this.findById(id)
    const updated = await this.tableRepo.update(id, data)
    await this.redisService.delByPattern('table:*')
    return updated
  }

  async delete(id: string, deletedById: string) {
    await this.findById(id)
    const deleted = await this.tableRepo.delete(id, deletedById)
    await this.redisService.delByPattern('table:*')
    return deleted
  }

  async findById(id: string) {
    const cacheKey = `table:${id}`
    const cached = await this.redisService.get<any>(cacheKey)
    if (cached) return cached

    const table = await this.tableRepo.findById(id)
    if (!table) throw new NotFoundException('Table not found')

    const qrCodeUrl = `${envConfig.FRONTEND_URL}/table/${table.id}?token=${(table as any).qrCode}`
    const result = { ...table, qrCodeUrl }

    await this.redisService.set(cacheKey, result, 600)
    return result
  }

  async list(query: GetTablesQueryType) {
    const cacheKey = `table:list:${JSON.stringify(query)}`
    const cached = await this.redisService.get<{ data: any[]; pagination: any }>(cacheKey)
    if (cached) return cached

    const { data: tables, pagination } = await this.tableRepo.list(query)

    const tablesWithQr = tables.map((table: RestaurantTableType) => ({
      ...table,
      qrCodeUrl: `${envConfig.FRONTEND_URL || 'http://localhost:3000'}/table/${table.id}?token=${(table as any).qrCode}`,
    }))

    const result = { data: tablesWithQr, pagination }
    await this.redisService.set(cacheKey, result, 300)
    return result
  }
}
