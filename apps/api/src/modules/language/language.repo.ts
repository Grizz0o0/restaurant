import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { CreateLanguageBodyType, GetLanguagesQueryType, UpdateLanguageBodyType } from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'

@Injectable()
export class LanguageRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLanguageBodyType & { createdById: string }) {
    return this.prisma.language.create({
      data: {
        id: data.id,
        name: data.name,
        createdById: data.createdById,
      },
    })
  }

  async update(id: string, data: UpdateLanguageBodyType, updatedById: string) {
    return this.prisma.language.update({
      where: { id },
      data: {
        name: data.name,
        updatedById,
      },
    })
  }

  async findById(id: string) {
    return this.prisma.language.findUnique({
      where: { id },
    })
  }

  async list(query: GetLanguagesQueryType) {
    const { page, limit, search } = query
    const where: Prisma.LanguageWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    return await paginate(
      this.prisma.language,
      {
        where,
        orderBy: { createdAt: 'desc' },
      },
      { page, limit },
    )
  }

  async delete(id: string, deletedById: string) {
    return this.prisma.extended.language.softDelete({ id })
  }
}
