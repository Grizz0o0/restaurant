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

    // 3. Emit real-time event
    this.socketGateway.sendToUser(data.toUserId, 'newMessage', message)

    return message
  }

  async getHistory(currentUserId: string, params: GetHistoryParamsType) {
    const { userId, cursor, limit } = params

    const messages = await this.prisma.message.findMany({
      take: limit + 1, // Fetch one extra to determine if there's a next page
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

    // Mark messages as read when fetched history with the other user
    // We only mark messages sent BY the other person TO us as read.
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
}
