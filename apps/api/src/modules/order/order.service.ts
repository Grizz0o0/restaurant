import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { OrderRepo } from './order.repo'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { AddressRepo } from '@/modules/address/address.repo'

import { TransactionReason } from 'src/generated/prisma/client'

import { CreateOrderBodyType, GetOrdersQueryType } from '@repo/schema'
import { DishRepo } from '@/modules/dish/dish.repo'

import { NotificationService } from '../notification/notification.service'

import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly dishRepo: DishRepo,
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,

    private readonly addressRepo: AddressRepo,
  ) {}

  async updateStatus(orderId: string, status: string, userId?: string) {
    const order = await this.orderRepo.updateStatus(orderId, status as any, userId)

    this.eventEmitter.emit('order.updated', {
      userId: order.userId, // Assuming order has userId
      orderId: order.id,
      status: order.status,
    })

    return order
  }

  async create({
    data,
    userId,
    tableId,
    roleName,
  }: {
    data: CreateOrderBodyType
    userId: string
    tableId?: string // From token (Guest)
    roleName: string
  }) {
    // If Guest, force tableId from token
    if (roleName === 'GUEST') {
      if (!tableId) throw new BadRequestException('Guest must belong to a table')
      data.tableId = tableId
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must have items')
    }

    // Fetch dishes to calculate price
    // Assuming findByIds or list with filter
    // For simplicity, fetching generic list or using Promise.all (not ideal for N items but okay for small orders)
    // Better: add findByIds to DishRepo. Or just iterate.

    const dishIds = [...new Set(data.items.map((item) => item.dishId))]
    const dishes = await this.dishRepo.findByIds(dishIds)
    const dishMap = new Map(dishes.map((d) => [d.id, d]))

    let totalPrice = 0
    const orderItems = []

    for (const item of data.items) {
      const dish = dishMap.get(item.dishId)
      if (!dish) throw new BadRequestException(`Dish ${item.dishId} not found`)

      const price = Number(dish.basePrice) || 0
      const itemTotal = price * item.quantity
      totalPrice += itemTotal

      // Get name from translation or fallback
      const dishName = dish.dishTranslations?.[0]?.name || 'Unknown Dish'

      orderItems.push({
        dishId: item.dishId,
        dishName,
        price: price,
        quantity: item.quantity,
        images: dish.images || [],
        skuValue: item.note || '',
      })
    }

    return this.orderRepo.create({
      tableId: data.tableId || null,
      guestId: roleName === 'GUEST' ? userId : null,
      totalPrice,
      status: 'PENDING',
      items: orderItems,
    })
  }

  private readonly logger = new Logger(OrderService.name)

  // ... (constructor remains same)

  async createFromCart({
    userId,
    tableId,
    roleName,
    promotionCode,
    guestInfo,
    addressId,
  }: {
    userId: string
    tableId?: string
    roleName: string
    promotionCode?: string
    guestInfo?: any
    addressId?: string
  }) {
    this.logger.log(`Creating order from cart for user: ${userId}, role: ${roleName}`)

    // If addressId is provided, fetch address details
    let orderGuestInfo = guestInfo || {}
    if (addressId) {
      const address = await this.addressRepo.findById(addressId)
      if (address) {
        orderGuestInfo = {
          ...orderGuestInfo,
          name: address.recipientName,
          phoneNumber: address.phoneNumber,
          address: address.address,
          addressLabel: address.label,
        }
      }
    }

    // If Guest, force tableId from token
    if (roleName === 'GUEST') {
      if (!tableId) throw new BadRequestException('Guest must belong to a table')
    }

    const validPaymentMethods = ['CASH', 'CARD', 'QR_PAY', 'BANK_TRANSFER', 'MOMO', 'OTHER'] // Matches PaymentMethod enum
    let paymentMethod = 'CASH'
    if (guestInfo?.paymentMethod && validPaymentMethods.includes(guestInfo.paymentMethod)) {
      paymentMethod = guestInfo.paymentMethod
    }

    return this.prismaService.$transaction(async (tx) => {
      // 1. Fetch Cart Items
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: {
          sku: {
            include: {
              dish: {
                include: {
                  dishTranslations: true,
                  inventories: {
                    include: {
                      inventory: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      this.logger.log(`Found ${cartItems.length} items in cart for user ${userId}`)

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty')
      }

      // 2. Calculate Subtotal & Prepare Snapshots
      let subTotal = 0
      const snapshots = []

      for (const item of cartItems) {
        const price = Number(item.sku.price)
        const quantity = item.quantity
        const itemTotal = price * quantity
        subTotal += itemTotal

        // Check and Deduct Stock
        if (item.sku.dish.inventories && item.sku.dish.inventories.length > 0) {
          for (const invDish of item.sku.dish.inventories) {
            const requiredQty = Number(invDish.quantityUsed) * quantity
            const currentStock = Number(invDish.inventory.quantity)

            if (currentStock < requiredQty) {
              throw new BadRequestException(
                `Insufficient stock for ingredient: ${invDish.inventory.itemName}. Required: ${requiredQty}, Available: ${currentStock}`,
              )
            }

            // Deduct stock
            await tx.inventory.update({
              where: { id: invDish.inventoryId },
              data: { quantity: { decrement: requiredQty } },
            })

            // Log transaction
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: invDish.inventoryId,
                changeQuantity: -requiredQty,
                reason: TransactionReason.ORDER,
                timestamp: new Date(),
              },
            })

            // Check Low Stock logic
            const newStock = currentStock - requiredQty
            const threshold = Number(invDish.inventory.threshold) || 0

            if (newStock <= threshold) {
              // Determine who to notify? Typically Admin or Manager.
              // For now, we create a system notification or emit event.
              // Since this is inside transaction, if we want to ensure notification is created, we can create it here.
              // Notification model likely requires userId. If we want global notification, maybe assign to admin.
              // Or better, just emit event as previously thought, but need to be sure event handler handles it.
              // Let's create a notification for "LOW_STOCK" type directly if schema supports it or use event.
              // The prompt asked for "Low stock alert logic (Notifications)".
              // I'll emit an event 'inventory.low_stock' and assume a listener handles it OR create a notification record if userId is available.
              // But inventory alert usually goes to Staff/Manager.
              // Let's stick to emitting event for modularity, as NotificationService might need to find all admins.
              this.eventEmitter.emit('inventory.low_stock', {
                inventoryId: invDish.inventoryId,
                itemName: invDish.inventory.itemName,
                currentStock: newStock,
                threshold: threshold,
                restaurantId: invDish.inventory.restaurantId,
              })
            }
          }
        }

        const dishName = item.sku.dish.dishTranslations[0]?.name || 'Unknown Dish'

        snapshots.push({
          dishId: item.sku.dish.id,
          dishName: dishName,
          price: item.sku.price,
          quantity: quantity,
          images: item.sku.images,
          skuValue: item.sku.value,
          skuId: item.skuId,
        })
      }

      // 3. Apply Promotion
      let discount = 0
      let promotionId = null

      if (promotionCode) {
        // We reuse PromotionService logic but need to inject it or replicate it.
        // Since PromotionService uses `this.prisma`, we might need to be careful if we want it to verify against the DB using `tx`.
        // PromotionService.apply is readonly (checks), so it's mostly fine to use the main instance,
        // but if we want to lock promotion usage, we definitely need `tx`.
        // For now, let's call PromotionService.apply. Ideally, we should refactor PromotionService to accept a prisma client or transaction.
        // Or just re-implement check here for safety.

        const promotion = await tx.promotion.findUnique({ where: { code: promotionCode } })

        if (!promotion) throw new BadRequestException('Invalid promotion code')

        // Simple validation replications
        const now = new Date()
        if (now < promotion.validFrom || now > promotion.validTo) {
          throw new BadRequestException('Promotion is expired or not yet valid')
        }
        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
          throw new BadRequestException('Promotion usage limit exceeded')
        }
        if (promotion.minOrderValue && subTotal < Number(promotion.minOrderValue)) {
          throw new BadRequestException(
            `Minimum order value of ${Number(promotion.minOrderValue)} required`,
          )
        }

        if (promotion.type === 'FIXED') {
          discount = Number(promotion.amount)
        } else if (promotion.type === 'PERCENTAGE') {
          if (promotion.percentage) {
            discount = (subTotal * Number(promotion.percentage)) / 100
          }
        }

        if (discount > subTotal) discount = subTotal

        promotionId = promotion.id

        // Increment usage
        await tx.promotion.update({
          where: { id: promotion.id },
          data: { usedCount: { increment: 1 } },
        })
      }

      // 4. Create Order
      const totalAmount = subTotal - discount

      const order = await tx.order.create({
        data: {
          userId: roleName === 'GUEST' ? null : userId,
          guestId: roleName === 'GUEST' ? userId : null,
          tableId: tableId || null,
          restaurantId: null, // Should infer from table/user? For now null or fetch default.
          totalAmount: totalAmount,
          discount: discount,
          status: 'PENDING_CONFIRMATION', // Enum
          channel: 'WEB', // Default
          promotionId: promotionId,
          guestInfo: orderGuestInfo,
          paymentMethod: paymentMethod as any, // Cast to PaymentMethod enum
          items: {
            create: snapshots,
          },
        },
        include: {
          items: true,
        },
      })

      // 5. Clear Cart
      await tx.cartItem.deleteMany({
        where: { userId },
      })

      // Emit event
      this.eventEmitter.emit('order.created', {
        orderId: order.id,
        userId: userId,
        totalAmount: totalAmount,
      })

      return order
    })
  }

  async list(query: GetOrdersQueryType) {
    return await this.orderRepo.list(query)
  }
}
