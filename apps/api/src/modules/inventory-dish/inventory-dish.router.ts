import { Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { z } from 'zod'
import { InventoryDishService } from './inventory-dish.service'
import {
  CreateInventoryDishBodySchema,
  CreateInventoryDishBodyType,
  GetDishIngredientsResSchema,
  UpdateInventoryDishBodySchema,
  UpdateInventoryDishBodyType,
  CreateInventorySkuBodySchema,
  CreateInventorySkuBodyType,
  GetSkuIngredientsResSchema,
  UpdateInventorySkuBodySchema,
  UpdateInventorySkuBodyType,
} from '@repo/schema'

@Router({ alias: 'inventoryDish' })
export class InventoryDishRouter {
  constructor(private readonly inventoryDishService: InventoryDishService) {}

  @Query({
    input: z.object({ dishId: z.string().uuid() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async getDishIngredients(@Input('dishId') dishId: string) {
    const data = await this.inventoryDishService.getDishIngredients(dishId)
    return { data }
  }

  @Mutation({
    input: CreateInventoryDishBodySchema,
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async addIngredientToDish(@Input() input: CreateInventoryDishBodyType) {
    return this.inventoryDishService.addIngredientToDish(input)
  }

  @Mutation({
    input: z.object({
      inventoryId: z.string().uuid(),
      dishId: z.string().uuid(),
      data: UpdateInventoryDishBodySchema,
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async updateIngredientQuantity(
    @Input() input: { inventoryId: string; dishId: string; data: UpdateInventoryDishBodyType },
  ) {
    return this.inventoryDishService.updateIngredientQuantity(
      input.inventoryId,
      input.dishId,
      input.data,
    )
  }

  @Mutation({
    input: z.object({
      inventoryId: z.string().uuid(),
      dishId: z.string().uuid(),
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async removeIngredientFromDish(@Input() input: { inventoryId: string; dishId: string }) {
    return this.inventoryDishService.removeIngredientFromDish(input.inventoryId, input.dishId)
  }

  @Query({
    input: z.object({ skuId: z.string().uuid() }),
    output: GetSkuIngredientsResSchema,
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async getSkuIngredients(@Input('skuId') skuId: string) {
    const data = await this.inventoryDishService.getSkuIngredients(skuId)
    return {
      data: data.map((item) => ({
        ...item,
        quantityUsed: Number(item.quantityUsed),
        inventory: item.inventory
          ? {
              ...item.inventory,
              quantity: Number(item.inventory.quantity),
            }
          : undefined,
      })),
    }
  }

  @Mutation({
    input: CreateInventorySkuBodySchema,
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async upsertSkuIngredient(@Input() input: CreateInventorySkuBodyType) {
    return this.inventoryDishService.upsertSkuIngredient(input)
  }

  @Mutation({
    input: z.object({
      inventoryId: z.string().uuid(),
      skuId: z.string().uuid(),
      data: UpdateInventorySkuBodySchema,
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async updateSkuIngredientQuantity(
    @Input() input: { inventoryId: string; skuId: string; data: UpdateInventorySkuBodyType },
  ) {
    return this.inventoryDishService.updateSkuIngredient(input.inventoryId, input.skuId, input.data)
  }

  @Mutation({
    input: z.object({
      inventoryId: z.string().uuid(),
      skuId: z.string().uuid(),
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async removeSkuIngredient(@Input() input: { inventoryId: string; skuId: string }) {
    return this.inventoryDishService.removeSkuIngredient(input.inventoryId, input.skuId)
  }
}
