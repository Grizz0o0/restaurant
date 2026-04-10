import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { ProfileService } from './profile.service'
import {
  ProfileDetailResSchema,
  UpdateProfileBodySchema,
  UserPreferenceSchema,
  UpdateUserPreferenceBodySchema,
} from '@repo/schema'

@Injectable()
export class ProfileRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly profileService: ProfileService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      getProfile: prot.output(ProfileDetailResSchema).query(async ({ ctx }) => {
        const result = await this.profileService.getProfile(ctx.user!.userId)
        return result
      }),

      updateProfile: prot
        .input(UpdateProfileBodySchema)
        .output(ProfileDetailResSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.profileService.updateProfile(ctx.user!.userId, input)
          return result
        }),

      getPreferences: prot.output(UserPreferenceSchema).query(async ({ ctx }) => {
        const result = await this.profileService.getPreferences(ctx.user!.userId)
        return result as any
      }),

      updatePreferences: prot
        .input(UpdateUserPreferenceBodySchema)
        .output(UserPreferenceSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.profileService.updatePreferences(ctx.user!.userId, input)
          return result as any
        }),
    })
  }
}
