import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateRestaurantBodySchema,
  UpdateRestaurantBodySchema,
  GetRestaurantsQuerySchema,
  RestaurantSchema,
  GetRestaurantsResSchema,
  AssignStaffBodySchema,
  RemoveStaffBodySchema,
} from '@repo/schema'
import { RestaurantService } from './restaurant.service'
import { z } from 'zod'

@Injectable()
export class RestaurantRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly restaurantService: RestaurantService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      list: prot
        .input(GetRestaurantsQuerySchema)
        .output(GetRestaurantsResSchema)
        .query(async ({ input }) => {
          const result = await this.restaurantService.list(input)
          return result
        }),

      detail: prot
        .input(z.object({ id: z.string() }))
        .output(RestaurantSchema.extend({ staff: z.any().optional() }))
        .query(async ({ input }) => {
          const result = await this.restaurantService.findById(input.id)
          return result
        }),

      getMain: prot.output(RestaurantSchema).query(async () => {
        const result = await this.restaurantService.getMain()
        return result
      }),

      create: prot
        .input(CreateRestaurantBodySchema)
        .output(RestaurantSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.restaurantService.create({
            ...input,
            createdById: ctx.user!.userId,
          })
          return result
        }),

      update: prot
        .input(z.object({ id: z.string(), data: UpdateRestaurantBodySchema }))
        .output(RestaurantSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.restaurantService.update(input.id, {
            ...input.data,
            updatedById: ctx.user!.userId,
          })
          return result
        }),

      delete: prot
        .input(z.object({ id: z.string() }))
        .output(z.any())
        .mutation(async ({ input, ctx }) => {
          const result = await this.restaurantService.delete(input.id, ctx.user!.userId)
          return result
        }),

      assignStaff: prot
        .input(AssignStaffBodySchema)
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.restaurantService.assignStaff(input)
          return result
        }),

      removeStaff: prot
        .input(RemoveStaffBodySchema)
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.restaurantService.removeStaff(input)
          return result
        }),
    })
  }
}
