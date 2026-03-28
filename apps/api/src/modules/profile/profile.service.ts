import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { ProfileRepo } from './profile.repo'
import { UpdateProfileBodyType, UpdateUserPreferenceBodyType } from '@repo/schema'
import { isUniqueConstraintPrismaError } from '@/shared/utils'
import { PrismaService } from '@/shared/prisma/prisma.service'

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepo: ProfileRepo,
    private readonly prisma: PrismaService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.profileRepo.findByIdWithRoleAndPermissions(userId)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async updateProfile(userId: string, updateData: UpdateProfileBodyType) {
    try {
      return await this.profileRepo.updateProfile({ userId, data: updateData })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Phone number already exists')
      }
      throw error
    }
  }
  async getPreferences(userId: string) {
    const preferences = await this.prisma.userPreference.findFirst({
      where: { userId },
    })


    if (!preferences) {
      return { preferences: {} }
    }

    return preferences
  }

  async updatePreferences(userId: string, updateData: UpdateUserPreferenceBodyType) {

    const existing = await this.prisma.userPreference.findFirst({
      where: { userId },
    })

    if (existing) {
      return this.prisma.userPreference.update({
        where: { id: existing.id },
        data: {
          preferences: updateData.preferences,
        },
      })
    }

    return this.prisma.userPreference.create({
      data: {
        userId,
        preferences: updateData.preferences,
      },
    })
  }
}
