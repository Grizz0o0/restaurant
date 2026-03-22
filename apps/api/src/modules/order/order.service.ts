import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { OrderRepo } from './order.repo'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { AddressRepo } from '@/modules/address/address.repo'

import { TransactionReason, Prisma } from 'src/generated/prisma/client'

import { CreateOrderBodyType, GetOrdersQueryType } from '@repo/schema'
import { DishRepo } from '@/modules/dish/dish.repo'

import { NotificationService } from '../notification/notification.service'

import { EventEmitter2 } from '@nestjs/event-emitter'
import { RoleName } from '@repo/constants'
import { ForbiddenException } from '@nestjs/common'

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

  async updateStatus(
    orderId: string,
    status: string,
    userId: string,
    roleName: string,
    extra?: {
      verificationCode?: string
      reason?: string
      promotionId?: string
      discount?: number
    },
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const order = await this.orderRepo.findById(orderId, tx)
      if (!order) throw new BadRequestException('Order not found')

      const oldStatus = order.status
      let targetStatus = status as any

      // 1. Role & Ownership Check
      const allowedRoles = [RoleName.Admin, RoleName.Manager, RoleName.Staff, RoleName.Shipper]
      if (!allowedRoles.includes(roleName as any)) {
        throw new ForbiddenException('Access denied')
      }

      if (roleName === RoleName.Shipper) {
        if (order.shipperId !== userId) {
          throw new ForbiddenException('You are not assigned to this order')
        }
        // Shippers can only move to DELIVERING, DELIVERED, RETURNED, BOOMED, COMPLETED
        const allowedShipperStatuses = [
          'DELIVERING',
          'DELIVERED',
          'RETURNED',
          'BOOMED',
          'COMPLETED',
        ]
        if (!allowedShipperStatuses.includes(status)) {
          throw new BadRequestException(`Shippers cannot update status to ${status}`)
        }
      }

      // 2. Business Logic Validation
      const extraData: {
        shipperId?: string
        deliveryCode?: string
        verificationCode?: string
        reason?: string
        promotionId?: string
        discount?: number
      } = {
        verificationCode: extra?.verificationCode,
        reason: extra?.reason,
      }

      // A. Auto-assign Shipper
      if (targetStatus === 'READY_FOR_PICKUP') {
        const shipper = await tx.user.findFirst({
          where: { role: { name: RoleName.Shipper }, status: 'ACTIVE' },
        })
        if (shipper) {
          extraData.shipperId = shipper.id
          this.logger.log(`Auto-assigned shipper ${shipper.name} to order ${orderId}`)
        }
      }

      // B. Generate Delivery Code
      if (targetStatus === 'DELIVERING') {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        extraData.deliveryCode = code
        // In a real app, send this code via SMS/Email/Notification to Customer
        this.logger.log(`Generated delivery code ${code} for order ${orderId}`)
        await this.notificationService.send(
          order.userId || '',
          'Cập nhật giao hàng',
          `Đơn hàng ${orderId} đang được giao. Mã xác nhận của bạn là: ${code}`,
          'ORDER_UPDATE',
          { orderId: orderId },
        )
      }

      // C. Verify Delivery Code
      if (
        (targetStatus === 'DELIVERED' || targetStatus === 'COMPLETED') &&
        roleName === RoleName.Shipper
      ) {
        if (!extra?.verificationCode) {
          throw new BadRequestException('Verification code is required to complete delivery')
        }
        if (order.deliveryCode !== extra.verificationCode) {
          throw new BadRequestException('Invalid verification code')
        }

        // Always move to COMPLETED when verification is successful
        targetStatus = 'COMPLETED'
      }

      // D. Promotion logic
      if (extra?.promotionId) {
        extraData.promotionId = extra.promotionId
        extraData.discount = extra.discount || 0

        // Increment promotion usage
        await tx.promotion.update({
          where: { id: extra.promotionId },
          data: {
            usedCount: { increment: 1 },
          },
        })
      }

      const updatedOrder = await this.orderRepo.updateStatus(
        orderId,
        targetStatus,
        userId,
        tx,
        extraData,
      )

      const isActiveStatus = (s: string) => !['PENDING_CONFIRMATION', 'CANCELLED'].includes(s)

      // Inventory sync logic
      let inventoryWarnings: string[] = []
      if (oldStatus === 'PENDING_CONFIRMATION' && isActiveStatus(status)) {
        inventoryWarnings = await this.syncInventory(orderId, 'DEDUCT', tx)
      } else if (
        isActiveStatus(oldStatus) &&
        (status === 'CANCELLED' || status === 'RETURNED' || status === 'BOOMED')
      ) {
        // We might return inventory if food is still good, but usually only for non-perishables.
        // For now, let's return for simplicity, but we could add more granular logic.
        await this.syncInventory(orderId, 'RETURN', tx)
      }

      this.eventEmitter.emit('order.updated', {
        userId: updatedOrder.userId,
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      })

      return {
        ...updatedOrder,
        inventoryWarnings,
      }
    })
  }

  private async syncInventory(
    orderId: string,
    action: 'DEDUCT' | 'RETURN',
    tx: Prisma.TransactionClient,
  ): Promise<string[]> {
    const warnings: string[] = []
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order || !order.items || order.items.length === 0) return []

    const dishIds = [...new Set(order.items.map((item) => item.dishId).filter(Boolean) as string[])]
    if (dishIds.length === 0) return []

    const dishes = await tx.dish.findMany({
      where: { id: { in: dishIds } },
      include: {
        inventories: {
          include: { inventory: true },
        },
      },
    })
    const dishMap = new Map(dishes.map((d) => [d.id, d]))

    for (const item of order.items) {
      if (!item.dishId) continue
      const dish = dishMap.get(item.dishId)
      if (!dish || !dish.inventories || dish.inventories.length === 0) continue

      for (const invDish of dish.inventories) {
        // Round to 4 decimal places to avoid floating point issues
        const requiredQty = Math.round(Number(invDish.quantityUsed) * item.quantity * 10000) / 10000

        if (action === 'DEDUCT') {
          const currentStock = Number(invDish.inventory.quantity)
          if (currentStock < requiredQty) {
            warnings.push(
              `Thiếu nguyên liệu: ${invDish.inventory.itemName}. Cần: ${requiredQty}, Có: ${currentStock}`,
            )
          }

          await tx.inventory.update({
            where: { id: invDish.inventoryId },
            data: { quantity: { decrement: requiredQty } },
          })

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: invDish.inventoryId,
              changeQuantity: -requiredQty,
              reason: TransactionReason.ORDER,
              timestamp: new Date(),
            },
          })

          const newStock = currentStock - requiredQty
          const threshold = Number(invDish.inventory.threshold) || 0
          if (newStock <= threshold) {
            this.eventEmitter.emit('inventory.low_stock', {
              inventoryId: invDish.inventoryId,
              itemName: invDish.inventory.itemName,
              currentStock: newStock,
              threshold: threshold,
              restaurantId: invDish.inventory.restaurantId,
            })
          }
        } else if (action === 'RETURN') {
          await tx.inventory.update({
            where: { id: invDish.inventoryId },
            data: { quantity: { increment: requiredQty } },
          })

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: invDish.inventoryId,
              changeQuantity: requiredQty,
              reason: TransactionReason.ORDER,
              timestamp: new Date(),
            },
          })
        }
      }
    }
    return warnings
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
      const viTranslation = dish.dishTranslations?.find((t) => t.languageId === 'vi')
      const dishName = viTranslation?.name || dish.dishTranslations?.[0]?.name || 'Unknown Dish'

      orderItems.push({
        dishId: item.dishId,
        dishName,
        price: price,
        quantity: item.quantity,
        images: dish.images || [],
        skuValue: '', // Reset skuValue hijacking
        note: item.note || '',
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

        const viTranslation = item.sku.dish.dishTranslations.find((t) => t.languageId === 'vi')
        const dishName =
          viTranslation?.name || item.sku.dish.dishTranslations[0]?.name || 'Unknown Dish'

        snapshots.push({
          dishId: item.sku.dish.id,
          dishName: dishName,
          price: item.sku.price,
          quantity: quantity,
          images: item.sku.images,
          skuValue: item.sku.value,
          skuId: item.skuId,
          note: item.note,
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
          user: roleName === 'GUEST' ? undefined : { connect: { id: userId } },
          guestId: roleName === 'GUEST' ? userId : null,
          table: tableId ? { connect: { id: tableId } } : undefined,
          restaurant: undefined, // Changed from null to fix TypeScript error
          totalAmount: totalAmount,
          discount: discount,
          status: 'PENDING_CONFIRMATION',
          channel: 'WEB',
          promotionId: promotionId, // Scalar seems okay? Or connect?
          guestInfo: orderGuestInfo,
          addressId: addressId || null,
          receiverName: orderGuestInfo?.name || null,
          deliveryPhone: orderGuestInfo?.phoneNumber || null,
          deliveryAddress: orderGuestInfo?.address || null,
          paymentMethod: paymentMethod as any,
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
