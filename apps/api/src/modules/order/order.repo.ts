import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'
import { GetOrdersQueryType } from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'
import { Prisma } from 'src/generated/prisma/client'

import { OrderStatus, Channel } from 'src/generated/prisma/client'

@Injectable()
export class OrderRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tableId: string | null
    guestId: string | null
    totalPrice: number
    status: string
    items: {
      dishId?: string
      dishName: string
      price: number
      quantity: number
      images: string[]
      skuValue?: string
    }[]
  }) {
    return this.prisma.order.create({
      data: {
        tableId: data.tableId,
        guestId: data.guestId,
        totalAmount: new Prisma.Decimal(data.totalPrice),
        status: OrderStatus.PENDING_CONFIRMATION,
        channel: Channel.WEB,
        items: {
          create: data.items.map((item) => ({
            dishId: item.dishId,
            dishName: item.dishName,
            price: new Prisma.Decimal(item.price),
            quantity: item.quantity,
            images: item.images,
            skuValue: item.skuValue || '',
          })),
        },
      },
      include: {
        items: true,
      },
    })
  }

  async list(query: GetOrdersQueryType) {
    const { page, limit, status, tableId, fromDate, toDate } = query
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(status && { status: status as OrderStatus }),
      ...(tableId && { tableId }),
      ...(fromDate &&
        toDate && {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        }),
      ...(query.userId && { userId: query.userId }),
    }

    return paginate(
      this.prisma.order,
      {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      },
      { page, limit },
    )
  }

  async updateStatus(id: string, status: OrderStatus, updatedById?: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status, updatedById },
      include: {
        items: true,
      },
    })
  }
}
