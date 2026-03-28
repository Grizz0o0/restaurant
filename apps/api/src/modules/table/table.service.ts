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

@Injectable()
export class TableService {
  constructor(
    private readonly tableRepo: TableRepo,
    private readonly prismaService: PrismaService,
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

    return this.tableRepo.create({
      ...data,
      restaurantId: restaurant.id,
      qrCode,
    })
  }

  async update(id: string, data: UpdateTableBodyType & { updatedById: string }) {
    await this.findById(id)
    return this.tableRepo.update(id, data)
  }

  async delete(id: string, deletedById: string) {
    await this.findById(id)
    return this.tableRepo.delete(id, deletedById)
  }

  async findById(id: string) {
    const table = await this.tableRepo.findById(id)
    if (!table) throw new NotFoundException('Table not found')

    const qrCodeUrl = `${envConfig.FRONTEND_URL}/table/${table.id}?token=${(table as any).qrCode}`

    return { ...table, qrCodeUrl }
  }

  async list(query: GetTablesQueryType) {
    const { data: tables, pagination } = await this.tableRepo.list(query)

    const tablesWithQr = tables.map((table: RestaurantTableType) => ({
      ...table,
      qrCodeUrl: `${envConfig.FRONTEND_URL || 'http://localhost:3000'}/table/${table.id}?token=${(table as any).qrCode}`,
    }))

    return { data: tablesWithQr, pagination }
  }
}
