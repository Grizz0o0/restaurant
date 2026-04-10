import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { CreateContactBodyType, GetContactsQueryType } from '@repo/schema'

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async submit(data: CreateContactBodyType) {
    const contact = await this.prisma.contactMessage.create({
      data: {
        ...data,
        status: 'UNREAD',
      },
    })

    // Notify admins/managers
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          name: { in: ['ADMIN', 'MANAGER'] },
        },
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    for (const admin of admins) {
      await this.notificationService.send(
        admin.id,
        'Tin nhắn liên hệ mới',
        `Bạn có tin nhắn mới từ ${data.name} (${data.email})`,
        'CONTACT',
        { contactId: contact.id },
      )
    }

    return contact
  }

  async list(query: GetContactsQueryType) {
    const { page, limit, status } = query
    const skip = (page - 1) * limit

    const [data, totalItems] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contactMessage.count({
        where: status ? { status } : undefined,
      }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async markAsRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status: 'READ' },
    })
  }

  async delete(id: string) {
    return this.prisma.contactMessage.delete({
      where: { id },
    })
  }
}
