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
      ...(tableId !== undefined && { tableId }),
      ...(fromDate &&
        toDate && {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        }),
      ...(query.userId && { userId: query.userId }),
      ...(query.shipperId && { shipperId: query.shipperId }),
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

  async updateStatus(
    id: string,
    status: OrderStatus,
    updatedById?: string,
    tx?: Prisma.TransactionClient,
    extraData?: {
      shipperId?: string
      deliveryCode?: string
      verificationCode?: string
      reason?: string
      promotionId?: string
      discount?: number
    },
  ) {
    const client = tx || this.prisma
    const { verificationCode, ...rest } = extraData || {}

    // Map verificationCode to deliveryCode if it exists (though it should be verified in service)
    const finalData: any = {
      status,
      ...(updatedById && { updatedBy: { connect: { id: updatedById } } }),
      ...rest,
    }

    if (rest.shipperId) {
      finalData.shipper = { connect: { id: rest.shipperId } }
      delete finalData.shipperId
    }

    if (verificationCode && !finalData.deliveryCode) {
      finalData.deliveryCode = verificationCode
    }

    // Prisma doesn't have 'reason' field in Order model, so we remove it
    delete finalData.reason

    return client.order.update({
      where: { id },
      data: finalData,
      include: {
        items: true,
      },
    })
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma
    return client.order.findUnique({
      where: { id },
      include: { items: true },
    })
  }
}
