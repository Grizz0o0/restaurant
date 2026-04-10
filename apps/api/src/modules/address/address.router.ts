import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  AddressSchema,
  CreateAddressBodySchema,
  UpdateAddressBodySchema,
  GetAddressesQuerySchema,
} from '@repo/schema'
import { AddressService } from './address.service'
import { z } from 'zod'

@Injectable()
export class AddressRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly addressService: AddressService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      create: prot
        .input(CreateAddressBodySchema)
        .output(AddressSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.addressService.create(ctx.user!.userId, input)
          return result
        }),

      list: prot
        .input(GetAddressesQuerySchema)
        .output(z.array(AddressSchema))
        .query(async ({ ctx }) => {
          const result = await this.addressService.list(ctx.user!.userId)
          return result
        }),

      update: prot
        .input(UpdateAddressBodySchema)
        .output(AddressSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.addressService.update(ctx.user!.userId, input)
          return result
        }),

      delete: prot
        .input(z.object({ id: z.string() }))
        .output(AddressSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.addressService.delete(ctx.user!.userId, input.id)
          return result
        }),

      setDefault: prot
        .input(z.object({ id: z.string() }))
        .output(AddressSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.addressService.setDefault(ctx.user!.userId, input.id)
          return result
        }),
    })
  }
}
