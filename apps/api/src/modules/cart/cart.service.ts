import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'

import { AddCartItemType, UpdateCartItemType, RemoveCartItemType } from '@repo/schema'

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        sku: {
          include: {
            dish: {
              include: {
                dishTranslations: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedItems = items.map((item) => {
      const dishName = item.sku.dish.dishTranslations[0]?.name || 'Unknown Dish'

      return {
        id: item.id,
        quantity: item.quantity,
        skuId: item.skuId,
        note: item.note,
        sku: {
          id: item.sku.id,
          value: item.sku.value,
          price: item.sku.price.toNumber(),
          stock: item.sku.stock,
          images: item.sku.images,
          dish: {
            id: item.sku.dish.id,
            name: dishName,
            images: item.sku.dish.images,
          },
        },
      }
    })

    const total = formattedItems.reduce((acc, item) => acc + item.sku.price * item.quantity, 0)

    return {
      items: formattedItems,
      total,
    }
  }

  private formatCartItem(item: any) {
    const dishName = item.sku.dish.dishTranslations[0]?.name || item.sku.dish.name || 'Unknown Dish'
    return {
      id: item.id,
      quantity: item.quantity,
      skuId: item.skuId,
      note: item.note,
      sku: {
        id: item.sku.id,
        value: item.sku.value,
        price: Number(item.sku.price),
        stock: item.sku.stock,
        images: item.sku.images,
        dish: {
          id: item.sku.dish.id,
          name: dishName,
          images: item.sku.dish.images,
        },
      },
    }
  }

  async addToCart(userId: string, input: AddCartItemType) {
    const { skuId, quantity, note } = input

    // Check if SKU exists
    const sku = await this.prisma.sKU.findUnique({
      where: { id: skuId },
    })
    if (!sku) {
      throw new NotFoundException('SKU not found')
    }

    // Check if item already exists in cart WITH SAME NOTE
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        skuId,
        note: note || null, // Only group items if notes match
      },
    })

    let result
    if (existingItem) {
      result = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          sku: {
            include: {
              dish: {
                include: {
                  dishTranslations: true,
                },
              },
            },
          },
        },
      })
    } else {
      result = await this.prisma.cartItem.create({
        data: {
          userId,
          skuId,
          quantity,
          note: note || null,
        },
        include: {
          sku: {
            include: {
              dish: {
                include: {
                  dishTranslations: true,
                },
              },
            },
          },
        },
      })
    }

    return this.formatCartItem(result)
  }

  async updateCartItem(userId: string, input: UpdateCartItemType) {
    const { itemId, quantity, note } = input

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    })

    if (!item || item.userId !== userId) {
      throw new NotFoundException('Cart item not found')
    }

    const result = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        note: note !== undefined ? note || null : undefined,
      },
      include: {
        sku: {
          include: {
            dish: {
              include: {
                dishTranslations: true,
              },
            },
          },
        },
      },
    })

    return this.formatCartItem(result)
  }

  async removeFromCart(userId: string, input: RemoveCartItemType) {
    const { itemId } = input

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    })

    if (!item || item.userId !== userId) {
      throw new NotFoundException('Cart item not found')
    }

    const result = await this.prisma.cartItem.delete({
      where: { id: itemId },
      include: {
        sku: {
          include: {
            dish: {
              include: {
                dishTranslations: true,
              },
            },
          },
        },
      },
    })

    return this.formatCartItem(result)
  }
}
