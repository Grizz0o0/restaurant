import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { DishRepo } from './dish.repo'
import { CreateDishBodyType, UpdateDishBodyType, GetDishesQueryType } from '@repo/schema'

import { PrismaService } from '@/shared/prisma'
import { generateSkuCombinations } from './dish.util'

@Injectable()
export class DishService {
  constructor(
    private readonly dishRepo: DishRepo,
    private readonly prisma: PrismaService,
  ) {}

  async create(params: CreateDishBodyType & { createdById: string }) {
    // Auto-generate SKUs if variants exist but skus are missing
    if (
      (!params.skus || params.skus.length === 0) &&
      params.variants &&
      params.variants.length > 0
    ) {
      const combinations = generateSkuCombinations(params.variants)
      params.skus = combinations.map((c) => ({
        value: `SKU-${c.internalId}-${Date.now()}`, // Ensure uniqueness
        price: params.basePrice,
        stock: 0,
        optionValues: c.optionValues,
        images: [],
      }))
    }

    return await this.dishRepo.create(params)
  }

  async checkVariantUpdateImpact(id: string, variants: UpdateDishBodyType['variants']) {
    return this.dishRepo.checkVariantDeletionImpact(id, variants)
  }

  async update(params: { id: string; data: UpdateDishBodyType; updatedById: string }) {
    const { id, data, updatedById } = params

    const existingDish = await this.dishRepo.findById(id)
    if (!existingDish) throw new NotFoundException('Dish not found')

    // Auto-generate SKUs if variants exist but skus are missing (e.g. adding variants to simple dish)
    if (data.variants && (!data.skus || data.skus.length === 0)) {
      const combinations = generateSkuCombinations(data.variants)
      data.skus = combinations.map((c) => ({
        value: `SKU-${c.internalId}-${Date.now()}`,
        price: data.basePrice ?? Number(existingDish.basePrice),
        stock: 0,
        optionValues: c.optionValues,
        images: [],
      }))
    }

    // Check variant impact if variants are being updated
    if (data.variants) {
      const impactedSkus = await this.dishRepo.checkVariantDeletionImpact(id, data.variants)
      if (impactedSkus.length > 0) {
        throw new UnprocessableEntityException({
          message: 'Update would delete active SKUs',
          impactedSkus,
        })
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      return this.dishRepo.update(params, tx)
    })
  }

  async findById(id: string) {
    const dish = await this.dishRepo.findById(id)
    if (!dish) throw new NotFoundException('Dish not found')
    return dish
  }

  async list(query: GetDishesQueryType) {
    const { pagination, data: dishes } = await this.dishRepo.list(query)
    const transformedDishes = dishes.map((dish) => {
      // Prioritize Vietnamese, then English, then whatever is available
      const translation =
        dish.dishTranslations?.find((t) => t.languageId === 'vi') ??
        dish.dishTranslations?.find((t) => t.languageId === 'en') ??
        dish.dishTranslations?.[0]

      const name = translation?.name ?? ''
      
      return {
        ...dish,
        name,
        description: translation?.description ?? '',
        languageId: translation?.languageId ?? 'vi',
        dishTranslations: dish.dishTranslations,
        isAvailable: dish.isAvailable, // Explicit assignment
      }
    })

    return { data: transformedDishes, pagination }
  }

  async delete(id: string, deletedById: string) {
    const dish = await this.dishRepo.findById(id)
    if (!dish) throw new NotFoundException('Dish not found')
    return await this.dishRepo.delete(id, deletedById)
  }
}
