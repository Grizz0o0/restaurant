import { Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { AdminRoleMiddleware } from '@/trpc/middlewares/admin-role.middleware'
import { z } from 'zod'
import { RestaurantStaffService } from './restaurant-staff.service'
import {
  CreateRestaurantStaffBodySchema,
  CreateRestaurantStaffBodyType,
  UpdateRestaurantStaffBodySchema,
  UpdateRestaurantStaffBodyType,
} from '@repo/schema'

@Router({ alias: 'restaurantStaff' })
export class RestaurantStaffRouter {
  constructor(private readonly restaurantStaffService: RestaurantStaffService) {}

  @Query({
    input: z.object({ restaurantId: z.string().uuid() }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async getStaffs(@Input('restaurantId') restaurantId: string) {
    return this.restaurantStaffService.getRestaurantStaffs(restaurantId)
  }

  @Mutation({
    input: z.object({
      restaurantId: z.string().uuid(),
      data: CreateRestaurantStaffBodySchema,
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async assignStaff(@Input() input: { restaurantId: string; data: CreateRestaurantStaffBodyType }) {
    return this.restaurantStaffService.assignStaff(input.restaurantId, input.data)
  }

  @Mutation({
    input: z.object({
      restaurantId: z.string().uuid(),
      userId: z.string().uuid(),
      data: UpdateRestaurantStaffBodySchema,
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async updateStaffPosition(
    @Input() input: { restaurantId: string; userId: string; data: UpdateRestaurantStaffBodyType },
  ) {
    return this.restaurantStaffService.updateStaffPosition(
      input.restaurantId,
      input.userId,
      input.data,
    )
  }

  @Mutation({
    input: z.object({
      restaurantId: z.string().uuid(),
      userId: z.string().uuid(),
    }),
    output: z.any(),
  })
  @UseMiddlewares(AuthMiddleware, AdminRoleMiddleware)
  async removeStaff(@Input() input: { restaurantId: string; userId: string }) {
    return this.restaurantStaffService.removeStaff(input.restaurantId, input.userId)
  }
}
