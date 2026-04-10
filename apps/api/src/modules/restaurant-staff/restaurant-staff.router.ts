import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { CreateRestaurantStaffBodySchema, UpdateRestaurantStaffBodySchema } from '@repo/schema'
import { RestaurantStaffService } from './restaurant-staff.service'
import { z } from 'zod'

@Injectable()
export class RestaurantStaffRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly restaurantStaffService: RestaurantStaffService,
  ) {}

  get router() {
    const { t, adminProcedure: admin } = this.trpcService
    return t.router({
      getStaffs: admin
        .input(z.object({ restaurantId: z.string().uuid() }))
        .output(z.any())
        .query(async ({ input }) => {
          const result = await this.restaurantStaffService.getRestaurantStaffs(input.restaurantId)
          return result
        }),

      assignStaff: admin
        .input(
          z.object({
            restaurantId: z.string().uuid(),
            data: CreateRestaurantStaffBodySchema,
          }),
        )
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.restaurantStaffService.assignStaff(
            input.restaurantId,
            input.data,
          )
          return result
        }),

      updateStaffPosition: admin
        .input(
          z.object({
            restaurantId: z.string().uuid(),
            userId: z.string().uuid(),
            data: UpdateRestaurantStaffBodySchema,
          }),
        )
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.restaurantStaffService.updateStaffPosition(
            input.restaurantId,
            input.userId,
            input.data,
          )
          return result
        }),

      removeStaff: admin
        .input(
          z.object({
            restaurantId: z.string().uuid(),
            userId: z.string().uuid(),
          }),
        )
        .output(z.any())
        .mutation(async ({ input }) => {
          const result = await this.restaurantStaffService.removeStaff(
            input.restaurantId,
            input.userId,
          )
          return result
        }),
    })
  }
}
