import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma'
import { Prisma } from 'src/generated/prisma/client'
import { CreateDishBodyType, UpdateDishBodyType, GetDishesQueryType } from '@repo/schema'
import { paginate } from '@/shared/utils/prisma.util'

@Injectable()
export class DishRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDishBodyType & { createdById: string }) {
    const {
      name,
      description,
      languageId,
      translations,
      categoryIds,
      createdById,
      variants,
      skus,
      ...dishData
    } = data

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Dish
      const dish = await tx.dish.create({
        data: {
          ...dishData,
          basePrice: new Prisma.Decimal(dishData.basePrice),
          virtualPrice: new Prisma.Decimal(dishData.virtualPrice),
          createdById,
          ...(categoryIds &&
            categoryIds.length > 0 && {
              categories: {
                connect: categoryIds.map((id: string) => ({ id })),
              },
            }),
        },
      })

      // 2. Translations
      const allTranslations = [{ languageId, name, description }, ...(translations || [])]
      if (allTranslations.length > 0) {
        await tx.dishTranslation.createMany({
          data: allTranslations.map((t) => ({
            dishId: dish.id,
            languageId: t.languageId,
            name: t.name,
            description: t.description,
            createdById,
          })),
        })
      }

      // 3. Variants & Options
      // Store created options in a 2D array to match SKUs by index
      // variants[i].options[j] -> optionId
      const createdOptionsMatrix: string[][] = []

      if (variants && variants.length > 0) {
        for (const variantData of variants) {
          const variant = await tx.variant.create({
            data: {
              dishId: dish.id,
              name: variantData.name,
              createdById,
            },
          })

          const optionIds: string[] = []
          for (const optionValue of variantData.options) {
            const option = await tx.variantOption.create({
              data: {
                variantId: variant.id,
                value: optionValue,
                createdById,
              },
            })
            optionIds.push(option.id)
          }
          createdOptionsMatrix.push(optionIds)
        }
      }

      // 4. SKUs
      if (skus && skus.length > 0) {
        for (const skuData of skus) {
          const skuOptionIds: string[] = []

          if (skuData.optionValues && skuData.optionValues.length > 0) {
            if (!variants || variants.length === 0) {
              throw new BadRequestException('SKU has options but no variants defined')
            }
            if (skuData.optionValues.length !== variants.length) {
              throw new BadRequestException('SKU option match failed: Dimension mismatch')
            }

            // Match by index: sku.optionValues[i] corresponds to variants[i]
            // We need to find which option ID corresponds to the value string
            skuData.optionValues.forEach((val, index) => {
              const variantOptions = variants[index].options // Strings ["S", "M"]
              const optionIndex = variantOptions.indexOf(val)

              if (optionIndex === -1) {
                throw new BadRequestException(
                  `Option value '${val}' not found in variant '${variants[index].name}'`,
                )
              }

              const optionId = createdOptionsMatrix[index][optionIndex]
              skuOptionIds.push(optionId)
            })
          }

          await tx.sKU.create({
            data: {
              dishId: dish.id,
              value: skuData.value,
              price: new Prisma.Decimal(skuData.price),
              stock: skuData.stock,
              images: skuData.images,
              createdById,
              ...(skuOptionIds.length > 0 && {
                variantOptions: {
                  connect: skuOptionIds.map((id) => ({ id })),
                },
              }),
            },
          })
        }
      } else if (!variants || variants.length === 0) {
        // Default SKU if no variants
        await tx.sKU.create({
          data: {
            dishId: dish.id,
            value: `DISH-${dish.id.substring(0, 8).toUpperCase()}`,
            price: new Prisma.Decimal(dishData.basePrice),
            stock: 0,
            createdById,
          },
        })
      }

      return dish
    })
  }

  // Check which SKUs would be deleted/invalidated if we apply the new variants structure
  async checkVariantDeletionImpact(dishId: string, newVariants: UpdateDishBodyType['variants']) {
    if (!newVariants) return []

    const existingDish = await this.findById(dishId)
    if (!existingDish) throw new BadRequestException('Dish not found')

    // Find options that are NOT present in the new structure
    // We need to treat "Renaming" as "Same ID" if ID is provided.
    // If ID not provided, it's new.

    // 1. Identify Existing Option IDs that will be KEPT
    const keptOptionIds = new Set<string>()

    for (const v of newVariants) {
      if (!v.id) continue // New variant, so all its options are new

      // Find existing variant
      const existingVariant = existingDish.variants.find((ex) => ex.id === v.id)
      if (!existingVariant) continue // ID provided but not found? Ignore or error.

      // In the existing variant, find options that match the new strings OR we can't really map strings to IDs easily if simply array of strings is passed.
      // Wait, the schema strictly says `options: string[]`.
      // So we can only match by VALUE for existing options?
      // OR we assume that if the user provides `v.id`, they want to update that variant.
      // But for options, we don't have IDs in the input.
      // So effectively: Any existing option for this variant whose VALUE is not in `v.options` is considered DELETED.

      for (const existingOpt of existingVariant.variantOptions) {
        if (v.options.includes(existingOpt.value)) {
          keptOptionIds.add(existingOpt.id)
        }
      }
    }

    // 2. Find all option IDs currently used by SKUs
    // We actually need to find SKUs that use options NOT in keptOptionIds

    // Get all current option IDs for this dish
    const allCurrentOptionIds = existingDish.variants.flatMap((v) =>
      v.variantOptions.map((o) => o.id),
    )
    const deletedOptionIds = allCurrentOptionIds.filter((id) => !keptOptionIds.has(id))

    if (deletedOptionIds.length === 0) return []

    // Find SKUs that use these deleted options
    const impactedSkus = await this.prisma.sKU.findMany({
      where: {
        dishId,
        variantOptions: {
          some: {
            id: { in: deletedOptionIds },
          },
        },
      },
      select: { id: true, value: true },
    })

    return impactedSkus
  }

  async update(
    { id, data, updatedById }: { id: string; data: UpdateDishBodyType; updatedById: string },
    tx?: Prisma.TransactionClient,
  ) {
    const { name, description, languageId, categoryIds, variants, ...dishData } = data
    const client = tx ?? this.prisma

    // Basic Update
    const dish = await client.dish.update({
      where: { id },
      data: {
        ...dishData,
        ...(dishData.basePrice && { basePrice: new Prisma.Decimal(dishData.basePrice) }),
        ...(dishData.virtualPrice && { virtualPrice: new Prisma.Decimal(dishData.virtualPrice) }),
        updatedById,
        ...(categoryIds && {
          categories: {
            set: categoryIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        dishTranslations: true,
        variants: { include: { variantOptions: true } },
      },
    })

    // Upsert Translations logic (keep from previous)
    if (name || description) {
      // ... (simplified call to helper if needed or inline)
      await this.upsertDishTranslation(id, { name, description, languageId, updatedById }, client)
    }

    // Variants Update Logic
    if (variants) {
      // This is complex. We need to sync the DB state with `variants` list.
      // 1. Delete removed Variants
      const inputVariantIds = variants.filter((v) => v.id).map((v) => v.id!)
      await client.variant.deleteMany({
        where: {
          dishId: id,
          id: { notIn: inputVariantIds },
        },
      })

      // 2. Update/Create Variants
      for (const vData of variants) {
        let variantId = vData.id

        if (variantId) {
          // Update Name
          await client.variant.update({
            where: { id: variantId },
            data: { name: vData.name, updatedById },
          })
        } else {
          // Create
          const newVariant = await client.variant.create({
            data: {
              dishId: id,
              name: vData.name,
              createdById: updatedById,
            },
          })
          variantId = newVariant.id
        }

        // Sync Options
        // Delete options not in vData.options
        // But matching by value since we don't have Option IDs in input
        await client.variantOption.deleteMany({
          where: {
            variantId: variantId,
            value: { notIn: vData.options },
          },
        })

        // Create missing options
        // We need to know which ones exist to avoid duplicates or error
        const existingOptions = await client.variantOption.findMany({
          where: { variantId: variantId },
        })
        const existingValues = new Set(existingOptions.map((o) => o.value))

        for (const val of vData.options) {
          if (!existingValues.has(val)) {
            await client.variantOption.create({
              data: {
                variantId: variantId,
                value: val,
                createdById: updatedById,
              },
            })
          }
        }
      }

      // Note: Logic for dealing with Orphaned SKUs due to option deletion
      // is expected to be handled by `onDelete: Cascade` in schema?
      // Schema: `variantOptions VariantOption[]` on SKU side.
      // `variantOption` has `skus SKU[]`.
      // Relation is explicit many-to-many? No, implicit?
      // Schema check:
      // model VariantOption { skus SKU[] }
      // model SKU { variantOptions VariantOption[] }
      // This is implicit many-to-many.
      // If a VariantOption is deleted, the join table entry is deleted. The SKU remains but has fewer options?
      // Yes.
      // The prompt says "Nếu xóa VariantOption, phải cảnh báo các SKU bị ảnh hưởng".
      // It implies we should probably delete the SKU if it becomes invalid (e.g. 2 options required, now 1).
      // But for now, the Repo just does the update. Validation happened before calling this.
    }

    return dish
  }

  async upsertDishTranslation(
    dishId: string,
    {
      name,
      description,
      languageId,
      updatedById,
    }: {
      name?: string
      description?: string
      languageId?: string
      updatedById: string
    },
    tx?: Prisma.TransactionClient,
  ) {
    if (!languageId) return

    const client = tx ?? this.prisma
    const existingTranslation = await client.dishTranslation.findFirst({
      where: {
        dishId,
        languageId,
      },
    })

    if (existingTranslation) {
      await client.dishTranslation.update({
        where: { id: existingTranslation.id },
        data: {
          name: name || existingTranslation.name,
          description: description || existingTranslation.description,
          updatedById,
        },
      })
    } else {
      await client.dishTranslation.create({
        data: {
          dishId,
          languageId,
          name: name || '',
          description: description || '',
          createdById: updatedById,
        },
      })
    }
  }

  findByIdOrThrow(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma
    return client.dish.findUniqueOrThrow({
      where: { id },
      include: {
        dishTranslations: true,
        categories: true,
        variants: {
          include: { variantOptions: true },
        },
        skus: {
          include: { variantOptions: true },
        },
        reviews: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  findById(id: string) {
    return this.prisma.dish.findUnique({
      where: { id },
      include: {
        dishTranslations: true,
        categories: true,
        variants: {
          include: { variantOptions: true },
        },
        skus: {
          include: { variantOptions: true },
        },
        reviews: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  findByIds(ids: string[]) {
    return this.prisma.dish.findMany({
      where: { id: { in: ids } },
      include: {
        dishTranslations: true,
        categories: true,
        variants: {
          include: { variantOptions: true },
        },
        skus: {
          include: { variantOptions: true },
        },
      },
    })
  }

  async list(query: GetDishesQueryType) {
    const { page, limit, search, categoryId, supplierId } = query

    const where: Prisma.DishWhereInput = {
      deletedAt: null,
      ...(supplierId && { supplierId }),
      ...(categoryId && { categories: { some: { id: categoryId } } }),
      ...(search && {
        dishTranslations: {
          some: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      }),
      ...(typeof query.isActive === 'boolean' && { isActive: query.isActive }),
    }
    const include = {
      dishTranslations: true,
      categories: true,
      variants: { include: { variantOptions: true } },
      skus: true,
    }

    // Type inference helper
    const getDishesWithRelations = () => {
      return this.prisma.dish.findFirst({ include })
    }
    type DishWithRelations = NonNullable<Awaited<ReturnType<typeof getDishesWithRelations>>>

    return await paginate<DishWithRelations>(
      this.prisma.dish,
      {
        where,
        orderBy: { createdAt: 'desc' },
        include,
      },
      { page, limit },
    )
  }
  async delete(id: string, deletedById: string) {
    return this.prisma.extended.dish.softDelete({ id, deletedById })
  }
}
