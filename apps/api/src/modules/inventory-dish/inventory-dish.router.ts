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
}
