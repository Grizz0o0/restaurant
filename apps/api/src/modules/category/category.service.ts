import { Injectable, NotFoundException } from '@nestjs/common'
import { CategoryRepo } from './category.repo'
import {
  CreateCategoryBodyType,
  UpdateCategoryBodyType,
  GetCategoriesQueryType,
} from '@repo/schema'
import { RedisService } from '@/shared/services/redis.service'

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepo,
    private readonly redisService: RedisService,
  ) {}

  private transform(category: any) {
    if (!category) return null
    const translation =
      category.dishCategoryTranslations?.find((t: any) => t.languageId === 'vi') ??
      category.dishCategoryTranslations?.find((t: any) => t.languageId === 'en') ??
      category.dishCategoryTranslations?.[0]

    return {
      ...category,
      name: translation?.name ?? '',
      description: translation?.description ?? '',
      languageId: translation?.languageId ?? 'vi',
      dishCategoryTranslations: category.dishCategoryTranslations,
    }
  }

  async create(params: CreateCategoryBodyType & { createdById: string }) {
    const category = await this.categoryRepo.create(params)
    await this.redisService.delByPattern('category:*')
    return this.transform(category)
  }

  async update(params: { id: string; data: UpdateCategoryBodyType; updatedById: string }) {
    const category = await this.categoryRepo.update(params)
    await this.redisService.delByPattern('category:*')
    return this.transform(category)
  }

  async findById(id: string) {
    const cacheKey = `category:detail:${id}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) return cached

    const category = await this.categoryRepo.findById(id)
    const transformed = this.transform(category)
    if (transformed) {
      await this.redisService.set(cacheKey, transformed, 600)
    }
    return transformed
  }

  async list(query: GetCategoriesQueryType) {
    const cacheKey = `category:list:${JSON.stringify(query)}`
    const cached = await this.redisService.get<{ data: any[]; pagination: any }>(cacheKey)
    if (cached) return cached

    const { pagination, data: categories } = await this.categoryRepo.list(query)
    const transformedCategories = categories.map((category) => this.transform(category))

    const result = { data: transformedCategories, pagination }
    await this.redisService.set(cacheKey, result, 300)
    return result
  }

  async delete(id: string, deletedById: string) {
    const category = await this.categoryRepo.findById(id)
    if (!category) throw new NotFoundException('Category not found')
    const result = await this.categoryRepo.delete(id, deletedById)
    await this.redisService.delByPattern('category:*')
    return result
  }
}
