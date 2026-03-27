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

  async getSkuIngredients(skuId: string) {
    return this.prisma.inventorySKU.findMany({
      where: { skuId },
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

  async upsertSkuIngredient(data: import('@repo/schema').CreateInventorySkuBodyType) {
    const sku = await this.prisma.sKU.findUnique({
      where: { id: data.skuId },
    })
    if (!sku) throw new NotFoundException('SKU not found')

    const inventory = await this.prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    })
    if (!inventory) throw new NotFoundException('Inventory not found')

    return this.prisma.inventorySKU.upsert({
      where: {
        inventoryId_skuId: {
          inventoryId: data.inventoryId,
          skuId: data.skuId,
        },
      },
      update: {
        quantityUsed: data.quantityUsed,
      },
      create: {
        inventoryId: data.inventoryId,
        skuId: data.skuId,
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

  async updateSkuIngredient(
    inventoryId: string,
    skuId: string,
    data: import('@repo/schema').UpdateInventorySkuBodyType,
  ) {
    return this.prisma.inventorySKU.update({
      where: {
        inventoryId_skuId: {
          inventoryId,
          skuId,
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

  async removeSkuIngredient(inventoryId: string, skuId: string) {
    return this.prisma.inventorySKU.delete({
      where: {
        inventoryId_skuId: {
          inventoryId,
          skuId,
        },
      },
    })
  }
}
