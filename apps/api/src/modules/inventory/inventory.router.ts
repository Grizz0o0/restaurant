import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateInventoryBodySchema,
  UpdateInventoryBodySchema,
  GetInventoriesQuerySchema,
  GetInventoryTransactionsQuerySchema,
} from '@repo/schema'
import { InventoryService } from './inventory.service'
import { z } from 'zod'

@Injectable()
export class InventoryRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly inventoryService: InventoryService,
  ) {}

  get router() {
    const { t, publicProcedure: pub, adminProcedure: admin } = this.trpcService
    return t.router({
      list: pub
        .input(GetInventoriesQuerySchema)
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.inventoryService.findAll(input)
          return result
        }),

      detail: pub
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.inventoryService.findOne(input.id)
          return result
        }),

      create: admin
        .input(CreateInventoryBodySchema)
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryService.create(input)
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdateInventoryBodySchema }))
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryService.update(input.id, input.data)
          return result
        }),

      delete: admin
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.inventoryService.remove(input.id)
          return result
        }),

      listTransactions: pub
        .input(GetInventoryTransactionsQuerySchema)
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.inventoryService.findAllTransactions(input)
          return result
        }),
    })
  }
}
