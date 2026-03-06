import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import {
  CreateRestaurantBodySchema,
  UpdateRestaurantBodySchema,
  CreateRestaurantBodyType,
  UpdateRestaurantBodyType,
  GetRestaurantsQuerySchema,
  GetRestaurantsQueryType,
  RestaurantSchema,
  GetRestaurantsResSchema,
  AssignStaffBodySchema,
  AssignStaffBodyType,
  RemoveStaffBodySchema,
  RemoveStaffBodyType,
} from '@repo/schema'
import { Context } from '@/trpc/context'
import { RestaurantService } from './restaurant.service'
import { z } from 'zod'

@Router({ alias: 'restaurant' })
@UseMiddlewares(AuthMiddleware)
export class RestaurantRouter {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query({
    input: GetRestaurantsQuerySchema,
    output: GetRestaurantsResSchema,
  })
  async list(@Input() input: GetRestaurantsQueryType) {
    return this.restaurantService.list(input)
  }

  @Query({
    input: z.object({ id: z.string() }),
    output: RestaurantSchema.extend({ staff: z.any().optional() }), // Relax output validation for included relations if needed
  })
  async detail(@Input('id') id: string) {
    return this.restaurantService.findById(id)
  }

  @Query({
    output: RestaurantSchema,
  })
  async getMain() {
    return this.restaurantService.getMain()
  }

  @Mutation({
    input: CreateRestaurantBodySchema,
    output: RestaurantSchema,
  })
  async create(@Input() input: CreateRestaurantBodyType, @Ctx() ctx: Context) {
    return this.restaurantService.create({ ...input, createdById: ctx.user!.userId })
  }

  @Mutation({
    input: z.object({
      id: z.string(),
      data: UpdateRestaurantBodySchema,
    }),
    output: RestaurantSchema,
  })
  async update(
    @Input() input: { id: string; data: UpdateRestaurantBodyType },
    @Ctx() ctx: Context,
  ) {
    return this.restaurantService.update(input.id, {
      ...input.data,
      updatedById: ctx.user!.userId,
    })
  }

  @Mutation({
    input: z.object({ id: z.string() }),
    output: z.any(),
  })
  async delete(@Input('id') id: string, @Ctx() ctx: Context) {
    return this.restaurantService.delete(id, ctx.user!.userId)
  }

  @Mutation({
    input: AssignStaffBodySchema,
    output: z.any(),
  })
  async assignStaff(@Input() input: AssignStaffBodyType) {
    return this.restaurantService.assignStaff(input)
  }

  @Mutation({
    input: RemoveStaffBodySchema,
    output: z.any(),
  })
  async removeStaff(@Input() input: RemoveStaffBodyType) {
    return this.restaurantService.removeStaff(input)
  }
}
