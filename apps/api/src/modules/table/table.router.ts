import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  GetTablesQuerySchema,
  GetTablesResSchema,
  CreateTableBodySchema,
  UpdateTableBodySchema,
  RestaurantTableSchema,
} from '@repo/schema'
import { TableService } from './table.service'
import { z } from 'zod'

@Injectable()
export class TableRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly tableService: TableService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot, adminProcedure: admin } = this.trpcService
    return t.router({
      list: prot
        .input(GetTablesQuerySchema)
        .output(GetTablesResSchema)
        .query(async ({ input }) => {
          const result = await this.tableService.list(input)
          return result
        }),

      detail: prot
        .input(z.object({ id: z.string() }))
        .output(RestaurantTableSchema)
        .query(async ({ input }) => {
          const result = await this.tableService.findById(input.id)
          return result
        }),

      create: admin
        .input(CreateTableBodySchema)
        .output(RestaurantTableSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.tableService.create({ ...input, createdById: ctx.user!.userId })
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdateTableBodySchema }))
        .output(RestaurantTableSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.tableService.update(input.id, {
            ...input.data,
            updatedById: ctx.user!.userId,
          })
          return result
        }),

      delete: admin
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const result = await this.tableService.delete(input.id, ctx.user!.userId)
          return result
        }),
    })
  }
}
