import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import {
  GetTablesQuerySchema,
  GetTablesResSchema,
  CreateTableBodySchema,
  UpdateTableBodySchema,
  CreateTableBodyType,
  GetTablesQueryType,
  UpdateTableBodyType,
  RestaurantTableSchema,
} from '@repo/schema'
import { Context } from '@/trpc/context'
import { TableService } from './table.service'
import { z } from 'zod'

@Router({ alias: 'table' })
@UseMiddlewares(AuthMiddleware)
export class TableRouter {
  constructor(private readonly tableService: TableService) {}

  @Query({
    input: GetTablesQuerySchema,
    output: GetTablesResSchema,
  })
  async list(@Input() input: GetTablesQueryType) {
    return this.tableService.list(input)
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: RestaurantTableSchema,
  })
  async detail(@Input('id') id: string) {
    return this.tableService.findById(id)
  }

  @Mutation({
    input: CreateTableBodySchema,
    output: RestaurantTableSchema,
  })
  @UseMiddlewares(AdminRoleMiddleware)
  async create(@Input() input: CreateTableBodyType, @Ctx() ctx: Context) {
    return this.tableService.create({ ...input, createdById: ctx.user!.userId })
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: UpdateTableBodySchema,
    }),
    output: RestaurantTableSchema,
  })
  @UseMiddlewares(AdminRoleMiddleware)
  async update(@Input() input: { id: string; data: UpdateTableBodyType }, @Ctx() ctx: Context) {
    return this.tableService.update(input.id, {
      ...input.data,
      updatedById: ctx.user!.userId,
    })
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  @UseMiddlewares(AdminRoleMiddleware)
  async delete(@Input('id') id: string, @Ctx() ctx: Context) {
    return this.tableService.delete(id, ctx.user!.userId)
  }
}
