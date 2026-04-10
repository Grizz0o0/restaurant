import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateSupplierBodySchema,
  UpdateSupplierBodySchema,
  GetSuppliersQuerySchema,
} from '@repo/schema'
import { SupplierService } from './supplier.service'
import { z } from 'zod'

@Injectable()
export class SupplierRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly supplierService: SupplierService,
  ) {}

  get router() {
    const { t, publicProcedure: pub, adminProcedure: admin } = this.trpcService
    return t.router({
      list: pub
        .input(GetSuppliersQuerySchema)
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.supplierService.findAll(input)
          return result
        }),

      detail: pub
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.supplierService.findOne(input.id)
          return result
        }),

      create: admin
        .input(CreateSupplierBodySchema)
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.supplierService.create(input)
          return result
        }),

      update: admin
        .input(z.object({ id: z.string(), data: UpdateSupplierBodySchema }))
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.supplierService.update(input.id, input.data)
          return result
        }),

      delete: admin
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.supplierService.remove(input.id)
          return result
        }),
    })
  }
}
