import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { Prisma, TransactionReason } from 'src/generated/prisma/client'
import { CreateInventoryBodyType, UpdateInventoryBodyType } from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInventoryBodyType) {
    const { restaurantId, supplierId, ...rest } = data
    return this.prisma.inventory.create({
      data: {
        ...rest,
        restaurant: { connect: { id: restaurantId } },
        supplier: supplierId ? { connect: { id: supplierId } } : undefined,
      },
    })
  }

  async linkDish(inventoryId: string, dishId: string, quantityUsed: number) {
    return this.prisma.inventoryDish.create({
      data: {
        inventoryId,
        dishId,
        quantityUsed: new Prisma.Decimal(quantityUsed),
      },
    })
  }

  async findAll(params: {
    page?: number
    limit?: number
    where?: Prisma.InventoryWhereInput
    orderBy?: Prisma.InventoryOrderByWithRelationInput
  }) {
    const { page = 1, limit = 10 } = params
    return paginate(
      this.prisma.inventory,
      {
        where: params.where,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: {
          supplier: true,
        },
      },
      { page, limit },
    )
  }

  async findOne(id: string) {
    return this.prisma.inventory.findUnique({
      where: { id },
      include: {
        dishes: {
          include: {
            dish: true,
          },
        },
        transactions: true,
      },
    })
  }

  async update(id: string, data: UpdateInventoryBodyType) {
    return this.prisma.$transaction(async (tx) => {
      const { supplierId, quantity, ...rest } = data

      const oldInv = await tx.inventory.findUniqueOrThrow({ where: { id } })

      const updatedInv = await tx.inventory.update({
        where: { id },
        data: {
          ...rest,
          ...(quantity !== undefined && { quantity: Math.round(Number(quantity) * 10000) / 10000 }),
          supplier: supplierId ? { connect: { id: supplierId } } : undefined,
        },
      })

      if (
        quantity !== undefined &&
        Math.round(Number(quantity) * 10000) / 10000 !== Math.round(Number(oldInv.quantity) * 10000) / 10000
      ) {
        const diff = Math.round((Number(quantity) - Number(oldInv.quantity)) * 10000) / 10000
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: id,
            changeQuantity: diff,
            reason: diff > 0 ? TransactionReason.RESTOCK : TransactionReason.ADJUST,
            timestamp: new Date(),
          },
        })
      }

      return updatedInv
    })
  }

  async remove(id: string) {
    return this.prisma.inventory.delete({
      where: { id },
    })
  }

  async findAllTransactions(params: {
    inventoryId?: string
    page?: number
    limit?: number
  }) {
    const { page = 1, limit = 20, inventoryId } = params
    return paginate(
      this.prisma.inventoryTransaction,
      {
        where: inventoryId ? { inventoryId } : undefined,
        orderBy: { timestamp: 'desc' },
        include: {
          inventory: {
            select: {
              itemName: true,
              unit: true,
            },
          },
        },
      },
      { page, limit },
    )
  }
}

