import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'
import { CreateAddressBodyType, UpdateAddressBodyType } from '@repo/schema'

@Injectable()
export class AddressRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateAddressBodyType) {
    return await this.prisma.userAddress.create({
      data: {
        userId,
        ...data,
      },
    })
  }

  async findById(id: string) {
    return this.prisma.userAddress.findUnique({
      where: { id },
    })
  }

  async list(userId: string) {
    return await this.prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async update(userId: string, data: UpdateAddressBodyType) {
    const { id, ...rest } = data
    return await this.prisma.userAddress.update({
      where: { id, userId },
      data: rest,
    })
  }

  async delete(userId: string, id: string) {
    return await this.prisma.userAddress.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    })
  }

  async setDefault(userId: string, id: string) {
    return await this.prisma.userAddress.update({
      where: { id, userId },
      data: { isDefault: true },
    })
  }

  async unsetAllDefaults(userId: string) {
    return await this.prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    })
  }
}
