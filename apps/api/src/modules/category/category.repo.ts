import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'
import { Prisma } from 'src/generated/prisma/client'
import {
  CreateCategoryBodyType,
  UpdateCategoryBodyType,
  GetCategoriesQueryType,
} from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'

@Injectable()
export class CategoryRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCategoryBodyType & { createdById: string }) {
    const { name, description, languageId, createdById, translations } = data

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.dishCategory.create({
        data: {
          createdById,
        },
      })

      const allTranslations = [{ languageId, name, description }, ...(translations || [])]

      if (allTranslations.length > 0) {
        await tx.dishCategoryTranslation.createMany({
          data: allTranslations.map((t) => ({
            categoryId: category.id,
            languageId: t.languageId,
            name: t.name,
            description: t.description,
            createdById,
          })),
        })
      }

      return tx.dishCategory.findUniqueOrThrow({
        where: { id: category.id },
        include: {
          dishCategoryTranslations: {
            where: { deletedAt: null },
          },
        },
      })
    })
  }

  update({
    id,
    data,
    updatedById,
  }: {
    id: string
    data: UpdateCategoryBodyType
    updatedById: string
  }) {
    const { name, description, languageId } = data

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.dishCategory.update({
        where: { id },
        data: {
          updatedById,
        },
        include: { dishCategoryTranslations: true },
      })
      if (!category) {
        throw new BadRequestException('Category not found')
      }

      if (name || description) {
        const existingTranslation = await tx.dishCategoryTranslation.findFirst({
          where: {
            categoryId: id,
            languageId,
          },
        })

        if (existingTranslation) {
          await tx.dishCategoryTranslation.update({
            where: { id: existingTranslation.id },
            data: {
              name: name || existingTranslation.name,
              description: description || existingTranslation.description,
              updatedById,
            },
          })
        } else if (languageId) {
          await tx.dishCategoryTranslation.create({
            data: {
              categoryId: id,
              languageId,
              name: name || '',
              description: description || '',
              createdById: updatedById,
            },
          })
        }
      }

      return tx.dishCategory.findUniqueOrThrow({
        where: { id },
        include: {
          dishCategoryTranslations: {
            where: { deletedAt: null },
          },
        },
      })
    })
  }

  findById(id: string) {
    return this.prisma.dishCategory.findUnique({
      where: { id },
      include: {
        dishCategoryTranslations: {
          where: { deletedAt: null },
        },
      },
    })
  }

  async list(query: GetCategoriesQueryType) {
    const { page, limit, search } = query

    const where: Prisma.DishCategoryWhereInput = {
      deletedAt: null,
      ...(search && {
        dishCategoryTranslations: {
          some: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      }),
    }

    return await paginate<
      Prisma.DishCategoryGetPayload<{
        include: {
          dishCategoryTranslations: true
        }
      }>
    >(
      this.prisma.dishCategory,
      {
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          dishCategoryTranslations: {
            where: { deletedAt: null },
          },
        },
      },
      { page, limit },
    )
  }

  async delete(id: string, deletedById: string) {
    const category = await this.findById(id)
    if (!category) throw new BadRequestException('Category not found')

    return this.prisma.dishCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    })
  }
}
