import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { SocketGateway } from '../socket/socket.gateway'
import { EmailService } from '@/shared/services/email.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { OnEvent } from '@nestjs/event-emitter'
import envConfig from '@/shared/config'

// Helper to translate order status to Vietnamese
function getOrderStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PREPARING: 'Đang chuẩn bị',
    READY: 'Sẵn sàng',
    DELIVERING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  }
  return statusMap[status] || status
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    private readonly socketGateway: SocketGateway,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      const projectId = envConfig.FIREBASE_PROJECT_ID
      const privateKey = envConfig.FIREBASE_PRIVATE_KEY
      const clientEmail = envConfig.FIREBASE_CLIENT_EMAIL

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL). Skipping Firebase initialization.',
        )
        return
      }

      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
        })
        this.logger.log('Firebase Admin initialized successfully')
      } catch (error) {
        this.logger.warn(
          'Failed to initialize Firebase Admin. Push notifications will not work.',
          error,
        )
      }
    }
  }

  async send(
    userId: string | null | undefined,
    title: string,
    body: string,
    type: 'ORDER_UPDATE' | 'PROMOTION' | 'LOW_STOCK' | 'CONTACT',
    data?: any,
  ) {
    if (!userId) {
      this.logger.debug(`Skipping notification (no userId) - type: ${type}, title: ${title}`)
      return
    }

    // 1. Save to Database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type,
        content: body,
        channel: 'APP',
      },
    })

    // 2. Real-time (Socket.io)
    this.socketGateway.sendToUser(userId, 'notification', {
      id: notification.id,
      title,
      body,
      type,
      data,
      createdAt: notification.createdAt,
    })

    // 3. Push Notification (FCM)
    const devices = await this.prisma.device.findMany({
      where: { userId, isActive: true, fcmToken: { not: null } },
    })

    const tokens = devices.map((d) => d.fcmToken).filter((t) => t !== null)
    if (tokens.length > 0) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: data ? { ...data, type } : { type },
        })
      } catch (error) {
        this.logger.error(`Failed to send FCM to user ${userId}`, error)
      }
    }

    // 4. Email (Optional logic based on priority)
    // Fetch user email if not passed
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (user && user.email) {
      if (type === 'ORDER_UPDATE' && data?.orderId) {
        try {
          const order = await this.prisma.order.findUnique({
            where: { id: data.orderId },
            include: { items: true },
          })

          if (order) {
            await this.emailService.sendOrderNotification(user.email, {
              orderId: order.id,
              customerName: user.name || 'Quý khách',
              items: order.items.map((item) => ({
                name: item.dishName,
                quantity: item.quantity,
                price: Number(item.price),
              })),
              total: Number(order.totalAmount),
              status: getOrderStatusDisplay(order.status),
              orderUrl: `${envConfig.FRONTEND_URL}/profile/orders/${order.id}`,
            })
            return
          }
        } catch (error) {
          this.logger.error(`Failed to send order email to ${user.email}`, error)
        }
      }

      try {
        await this.emailService.sendNotification(user.email, title, body)
      } catch (error) {
        this.logger.error(`Failed to send notification email to ${user.email}`, error)
      }
    }
  }

  @OnEvent('order.updated')
  async handleOrderUpdate(payload: { userId: string; orderId: string; status: string }) {
    await this.send(
      payload.userId,
      'Cập nhật đơn hàng',
      `Đơn hàng #${payload.orderId} của bạn đã chuyển sang trạng thái: ${payload.status}`,
      'ORDER_UPDATE',
      { orderId: payload.orderId },
    )
  }

  @OnEvent('promotion.created') // Example event
  async handlePromotionCreated(payload: {
    promotionId: string
    code: string
    description: string
    userIds?: string[]
  }) {
    if (payload.userIds && payload.userIds.length > 0) {
      // Fetch full promotion details
      const promotion = await this.prisma.promotion.findUnique({
        where: { id: payload.promotionId },
      })

      if (!promotion) {
        this.logger.error(`Promotion ${payload.promotionId} not found`)
        return
      }

      // Batch fetch all users to avoid N+1 query
      const users = await this.prisma.user.findMany({
        where: { id: { in: payload.userIds } },
        select: { id: true, email: true, name: true },
      })

      for (const user of users) {
        // Send notification to app/socket
        try {
          await this.send(
            user.id,
            'Mã khuyến mãi mới!',
            `Nhập mã ${payload.code} để nhận ưu đãi: ${payload.description}`,
            'PROMOTION',
          )
        } catch (error) {
          this.logger.error(`Failed to send promotion notification to user ${user.id}`, error)
        }

        // Send rich email
        if (user.email) {
          try {
            let discount = ''
            if (promotion.percentage) {
              discount = `Giảm ${Number(promotion.percentage)}%`
            } else if (promotion.amount) {
              discount = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(Number(promotion.amount))
            }

            await this.emailService.sendPromotionNotification(user.email, {
              code: promotion.code,
              description: payload.description,
              validFrom: promotion.validFrom,
              validTo: promotion.validTo,
              minOrderValue: promotion.minOrderValue ? Number(promotion.minOrderValue) : undefined,
              discount,
              unsubscribeToken: Buffer.from(user.id).toString('base64'),
            })
          } catch (error) {
            this.logger.error(`Failed to send promotion email to ${user.email}`, error)
          }
        }
      }
    }
  }

  @OnEvent('inventory.low_stock')
  async handleLowStock(payload: {
    inventoryId: string
    itemName: string
    currentStock: number
    threshold: number
  }) {
    this.logger.warn(
      `Low stock alert for ${payload.itemName}: ${payload.currentStock} (Threshold: ${payload.threshold})`,
    )

    // Fetch inventory details for unit
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: payload.inventoryId },
    })

    if (!inventory) {
      this.logger.error(`Inventory ${payload.inventoryId} not found`)
      return
    }

    // Find Admins/Managers to notify
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          name: { in: ['ADMIN', 'MANAGER'] },
        },
        status: 'ACTIVE',
      },
      select: { id: true, email: true },
    })

    for (const admin of admins) {
      // Send notification to app/socket
      await this.send(
        admin.id,
        'Cảnh báo tồn kho!',
        `Nguyên liệu ${payload.itemName} sắp hết. Tồn kho hiện tại: ${payload.currentStock} ${payload.threshold ? `(Ngưỡng: ${payload.threshold})` : ''}`,
        'LOW_STOCK',
        { inventoryId: payload.inventoryId },
      )

      // Send rich email
      if (admin.email) {
        try {
          await this.emailService.sendLowStockAlert(admin.email, {
            itemName: payload.itemName,
            currentStock: Number(inventory.quantity),
            threshold: Number(inventory.threshold),
            unit: inventory.unit,
            inventoryUrl: `${envConfig.FRONTEND_URL}/admin/inventory`,
          })
        } catch (error) {
          this.logger.error(`Failed to send low stock email to ${admin.email}`, error)
        }
      }
    }
  }

  async getNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 recent notifications
    })

    return notifications.map((n) => ({
      id: n.id,
      title: this.getTitleFromType(n.type),
      content: n.content,
      type: n.type,
      isRead: !!n.readAt,
      createdAt: n.createdAt,
      data: undefined,
    }))
  }

  private getTitleFromType(type: string): string {
    switch (type) {
      case 'ORDER_UPDATE':
        return 'Cập nhật đơn hàng'
      case 'PROMOTION':
        return 'Khuyến mãi'
      case 'LOW_STOCK':
        return 'Cảnh báo tồn kho'
      case 'CONTACT':
        return 'Liên hệ mới'
      case 'RECOMMENDATION':
        return 'Gợi ý món ăn'
      default:
        return 'Thông báo mới'
    }
  }

  async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      await this.prisma.notification.update({
        where: { id: notificationId, userId },
        data: { readAt: new Date() },
      })
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      })
    }
    return true
  }
}
