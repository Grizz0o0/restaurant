import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { Prisma } from 'src/generated/prisma/client'
import { CreateSupplierBodyType, UpdateSupplierBodyType } from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSupplierBodyType & { languageId?: string }) {
    // ... existing implementation remains the same
    const { translations, ...rest } = data

    return this.prisma.supplier.create({
      data: {
        ...rest,
        supplierTranslations:
          translations && translations.length > 0
            ? {
                create: translations.map((t) => ({
                  languageId: t.languageId,
                  name: rest.name, 
                  description: t.description || '',
                })),
              }
            : undefined,
      },
      include: {
        supplierTranslations: true,
      },
    })
  }

  async findAll(params: {
    page?: number
    limit?: number
    where?: Prisma.SupplierWhereInput
    orderBy?: Prisma.SupplierOrderByWithRelationInput
  }) {
    const { page = 1, limit = 10 } = params
    return paginate(
      this.prisma.supplier,
      {
        where: params.where,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: {
          supplierTranslations: true,
        },
      },
      { page, limit },
    )
  }

  async findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: {
        supplierTranslations: true,
        inventories: true,
      },
    })
  }

  async update(id: string, data: UpdateSupplierBodyType) {
    const { translations, ...rest } = data

    // For update, it is trickier with translations (update or create).
    // Simple approach: Update main fields. Translations handling usually requires dedicated endpoints or complex logic.
    // For this MVP, we update main fields.

    return this.prisma.supplier.update({
      where: { id },
      data: rest,
    })
  }

  async remove(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    })
  }
}
