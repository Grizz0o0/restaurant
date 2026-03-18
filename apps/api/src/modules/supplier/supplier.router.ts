import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { CreateSupplierBodySchema, UpdateSupplierBodySchema, GetSuppliersQuerySchema, GetSuppliersQueryType } from '@repo/schema'
import { Context } from '@/trpc/context'
import { SupplierService } from './supplier.service'
import { z } from 'zod'

@Router({ alias: 'supplier' })
export class SupplierRouter {
  constructor(private readonly supplierService: SupplierService) {}

  @Query({
    input: GetSuppliersQuerySchema,
    output: z.any(),
  })
  async list(@Input() input: GetSuppliersQueryType) {
    return this.supplierService.findAll(input)
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  async detail(@Input('id') id: string) {
    return this.supplierService.findOne(id)
  }

  @Mutation({
    input: CreateSupplierBodySchema,
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async create(@Input() input: any) {
    return this.supplierService.create(input)
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: UpdateSupplierBodySchema,
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async update(@Input() input: { id: string; data: any }) {
    return this.supplierService.update(input.id, input.data)
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async delete(@Input('id') id: string) {
    return this.supplierService.remove(id)
  }
}
