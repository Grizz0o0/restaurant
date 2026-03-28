import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { SocketGateway } from '../socket/socket.gateway'
import { SendMessageBodyType, GetHistoryParamsType } from '@repo/schema'

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async sendMessage(fromUserId: string, data: SendMessageBodyType) {
    // 1. Verify recipient
    const recipient = await this.prisma.user.findUnique({
      where: { id: data.toUserId },
    })
    if (!recipient) {
      throw new NotFoundException('Recipient not found')
    }

    // 2. Save message to DB
    const message = await this.prisma.message.create({
      data: {
        fromUserId,
        toUserId: data.toUserId,
        content: data.content,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    this.socketGateway.sendToUser(data.toUserId, 'newMessage', message)

    return message
  }

  async getHistory(currentUserId: string, params: GetHistoryParamsType) {
    const { userId, cursor, limit } = params

    const messages = await this.prisma.message.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        OR: [
          { fromUserId: currentUserId, toUserId: userId },
          { fromUserId: userId, toUserId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (messages.length > limit) {
      const nextItem = messages.pop()
      nextCursor = nextItem!.id
    }

    await this.prisma.message.updateMany({
      where: {
        fromUserId: userId,
        toUserId: currentUserId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    return {
      messages: messages.reverse(), // Sort oldest to newest for UI
      nextCursor,
    }
  }

  async getConversations(adminId: string) {
    // 1. Fetch all messages involving the admin
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ fromUserId: adminId }, { toUserId: adminId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
      },
    })

    // 2. Group by the OTHER user
    const conversationMap = new Map<string, any>()

    for (const msg of messages) {
      const otherUserId = msg.fromUserId === adminId ? msg.toUserId : msg.fromUserId
      const isUnread = msg.toUserId === adminId && msg.readAt === null

      if (!conversationMap.has(otherUserId)) {
        const otherUser = msg.fromUserId === adminId ? msg.toUser : msg.fromUser
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          name: otherUser?.name || 'Unknown',
          avatar: otherUser?.avatar || null,
          lastMessage: {
            id: msg.id,
            fromUserId: msg.fromUserId,
            toUserId: msg.toUserId,
            content: msg.content,
            readAt: msg.readAt,
            createdAt: msg.createdAt,
          },
          unreadCount: isUnread ? 1 : 0,
        })
      } else {
        if (isUnread) {
          const current = conversationMap.get(otherUserId)
          current.unreadCount += 1
        }
      }
    }

    return {
      conversations: Array.from(conversationMap.values()),
    }
  }

  async getAdmin() {
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    })
    if (!adminRole) return null

    const adminUser = await this.prisma.user.findFirst({
      where: { roleId: adminRole.id },
      select: { id: true },
    })

    return adminUser
  }
}
