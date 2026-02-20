import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { CreateInventoryDishBodyType, UpdateInventoryDishBodyType } from '@repo/schema'

@Injectable()
export class InventoryDishService {
  constructor(private readonly prisma: PrismaService) {}

  async addIngredientToDish(data: CreateInventoryDishBodyType) {
    const dish = await this.prisma.dish.findUnique({
      where: { id: data.dishId },
    })
    if (!dish) throw new NotFoundException('Dish not found')

    const inventory = await this.prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    })
    if (!inventory) throw new NotFoundException('Inventory not found')

    return this.prisma.inventoryDish.upsert({
      where: {
        inventoryId_dishId: {
          inventoryId: data.inventoryId,
          dishId: data.dishId,
        },
      },
      update: {
        quantityUsed: data.quantityUsed,
      },
      create: {
        inventoryId: data.inventoryId,
        dishId: data.dishId,
        quantityUsed: data.quantityUsed,
      },
      include: {
        inventory: {
          select: {
            itemName: true,
            unit: true,
            quantity: true,
          },
        },
      },
    })
  }

  async updateIngredientQuantity(
    inventoryId: string,
    dishId: string,
    data: UpdateInventoryDishBodyType,
  ) {
    return this.prisma.inventoryDish.update({
      where: {
        inventoryId_dishId: {
          inventoryId,
          dishId,
        },
      },
      data: {
        quantityUsed: data.quantityUsed,
      },
      include: {
        inventory: {
          select: {
            itemName: true,
            unit: true,
            quantity: true,
          },
        },
      },
    })
  }

  async removeIngredientFromDish(inventoryId: string, dishId: string) {
    return this.prisma.inventoryDish.delete({
      where: {
        inventoryId_dishId: {
          inventoryId,
          dishId,
        },
      },
    })
  }

  async getDishIngredients(dishId: string) {
    return this.prisma.inventoryDish.findMany({
      where: { dishId },
      include: {
        inventory: {
          select: {
            itemName: true,
            unit: true,
            quantity: true,
          },
        },
      },
    })
  }
}
