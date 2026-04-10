import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateInventoryDishBodySchema,
  GetSkuIngredientsResSchema,
  UpdateInventoryDishBodySchema,
  CreateInventorySkuBodySchema,
  UpdateInventorySkuBodySchema,
} from '@repo/schema'
import { InventoryDishService } from './inventory-dish.service'
import { z } from 'zod'

@Injectable()
export class InventoryDishRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly inventoryDishService: InventoryDishService,
  ) {}

  get router() {
    const { t, adminProcedure: admin } = this.trpcService
    return t.router({
      getDishIngredients: admin
        .input(z.object({ dishId: z.string().uuid() }))
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.inventoryDishService.getDishIngredients(input.dishId)
          return result
        }),

      addIngredientToDish: admin
        .input(CreateInventoryDishBodySchema)
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryDishService.addIngredientToDish(input)
          return result
        }),

      updateIngredientQuantity: admin
        .input(
          z.object({
            inventoryId: z.string().uuid(),
            dishId: z.string().uuid(),
            data: UpdateInventoryDishBodySchema,
          }),
        )
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryDishService.updateIngredientQuantity(
            input.inventoryId,
            input.dishId,
            input.data,
          )
          return result
        }),

      removeIngredientFromDish: admin
        .input(z.object({ inventoryId: z.string().uuid(), dishId: z.string().uuid() }))
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryDishService.removeIngredientFromDish(
            input.inventoryId,
            input.dishId,
          )
          return result
        }),

      getSkuIngredients: admin
        .input(z.object({ skuId: z.string().uuid() }))
        .output(GetSkuIngredientsResSchema)
        .query(async ({ input }) => {
          const data = await this.inventoryDishService.getSkuIngredients(input.skuId)
          const result = {
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
          return result
        }),

      upsertSkuIngredient: admin
        .input(CreateInventorySkuBodySchema)
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryDishService.upsertSkuIngredient(input)
          return result
        }),

      updateSkuIngredientQuantity: admin
        .input(
          z.object({
            inventoryId: z.string().uuid(),
            skuId: z.string().uuid(),
            data: UpdateInventorySkuBodySchema,
          }),
        )
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryDishService.updateSkuIngredient(
            input.inventoryId,
            input.skuId,
            input.data,
          )
          return result
        }),

      removeSkuIngredient: admin
        .input(z.object({ inventoryId: z.string().uuid(), skuId: z.string().uuid() }))
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryDishService.removeSkuIngredient(
            input.inventoryId,
            input.skuId,
          )
          return result
        }),
    })
  }
}
