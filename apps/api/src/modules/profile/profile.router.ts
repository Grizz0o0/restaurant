import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { AuthMiddleware } from '@/trpc/middlewares/auth.middleware'
import { ProfileService } from './profile.service'
import {
  ProfileDetailResSchema,
  UpdateProfileBodySchema,
  UpdateProfileBodyType,
  UserPreferenceSchema,
  UpdateUserPreferenceBodySchema,
  UpdateUserPreferenceBodyType,
} from '@repo/schema'
import { Context } from '@/trpc/context'

@Router({ alias: 'profile' })
@UseMiddlewares(AuthMiddleware)
export class ProfileRouter {
  constructor(private readonly profileService: ProfileService) {}

  @Query({
    output: ProfileDetailResSchema,
  })
  async getProfile(@Ctx() ctx: Context) {
    return this.profileService.getProfile(ctx.user!.userId)
  }

  @Mutation({
    input: UpdateProfileBodySchema,
    output: ProfileDetailResSchema,
  })
  async updateProfile(@Input() input: UpdateProfileBodyType, @Ctx() ctx: Context) {
    return this.profileService.updateProfile(ctx.user!.userId, input)
  }

  @Query({
    output: UserPreferenceSchema,
  })
  async getPreferences(@Ctx() ctx: Context) {
    return this.profileService.getPreferences(ctx.user!.userId)
  }

  @Mutation({
    input: UpdateUserPreferenceBodySchema,
    output: UserPreferenceSchema,
  })
  async updatePreferences(@Input() input: UpdateUserPreferenceBodyType, @Ctx() ctx: Context) {
    return this.profileService.updatePreferences(ctx.user!.userId, input)
  }
}
