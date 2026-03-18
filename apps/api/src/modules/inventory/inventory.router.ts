import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { CreateInventoryBodySchema, UpdateInventoryBodySchema, GetInventoriesQuerySchema, GetInventoriesQueryType, GetInventoryTransactionsQuerySchema, GetInventoryTransactionsQueryType } from '@repo/schema'

import { Context } from '@/trpc/context'
import { InventoryService } from './inventory.service'
import { z } from 'zod'

@Router({ alias: 'inventory' })
export class InventoryRouter {
  constructor(private readonly inventoryService: InventoryService) {}

  @Query({
    input: GetInventoriesQuerySchema,
    output: z.any(),
  })
  async list(@Input() input: GetInventoriesQueryType) {
    return this.inventoryService.findAll(input)
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  async detail(@Input('id') id: string) {
    return this.inventoryService.findOne(id)
  }

  @Mutation({
    input: CreateInventoryBodySchema,
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async create(@Input() input: any) {
    return this.inventoryService.create(input)
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: UpdateInventoryBodySchema,
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async update(@Input() input: { id: string; data: any }) {
    return this.inventoryService.update(input.id, input.data)
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async delete(@Input('id') id: string) {
    return this.inventoryService.remove(id)
  }

  @Query({
    input: GetInventoryTransactionsQuerySchema,
    output: z.any(),
  })
  async listTransactions(@Input() input: GetInventoryTransactionsQueryType) {
    return this.inventoryService.findAllTransactions(input)
  }
}

