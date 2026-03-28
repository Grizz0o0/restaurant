import { Injectable, NotFoundException } from '@nestjs/common'
import { CategoryRepo } from './category.repo'
import {
  CreateCategoryBodyType,
  UpdateCategoryBodyType,
  GetCategoriesQueryType,
} from '@repo/schema'

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepo) {}

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
    return this.transform(category)
  }

  async update(params: { id: string; data: UpdateCategoryBodyType; updatedById: string }) {
    const category = await this.categoryRepo.update(params)
    return this.transform(category)
  }

  async findById(id: string) {
    const category = await this.categoryRepo.findById(id)
    return this.transform(category)
  }

  async list(query: GetCategoriesQueryType) {
    const { pagination, data: categories } = await this.categoryRepo.list(query)

    const transformedCategories = categories.map((category) => this.transform(category))

    return { data: transformedCategories, pagination }
  }

  async delete(id: string, deletedById: string) {
    const category = await this.categoryRepo.findById(id)
    if (!category) throw new NotFoundException('Category not found')
    return await this.categoryRepo.delete(id, deletedById)
  }
}
