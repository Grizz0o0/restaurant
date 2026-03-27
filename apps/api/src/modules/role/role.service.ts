import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { RoleRepo } from './role.repo'
import { CreateRoleBodyType, UpdateRoleBodyType } from '@repo/schema'
import { isUniqueConstraintPrismaError } from '@/shared/utils'

import { RoleName } from '@repo/constants'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepo: RoleRepo) {}

  private async verifyRole(roleId: string) {
    const role = await this.roleRepo.findById(roleId)
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Manager, RoleName.Staff]

    if (baseRoles.includes(role.name)) {
      throw new ForbiddenException('Role is protected')
    }
  }

  async list({ limit, page }: { limit: number; page: number }) {
    return await this.roleRepo.list({ page, limit })
  }

  async findById(id: string) {
    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('Role not found')
    return role
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: string }) {
    try {
      return await this.roleRepo.create({ data, createdById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw new ConflictException('Role already exists')
      throw error
    }
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: string
    data: UpdateRoleBodyType
    updatedById: string
  }) {
    try {
      await this.verifyRole(id)

      return await this.roleRepo.update({ id, data, updatedById })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) throw new ConflictException('Role already exists')
      throw error
    }
  }

  async assignPermissions({
    roleId,
    permissionIds,
    updatedById,
  }: {
    roleId: string
    permissionIds: string[]
    updatedById: string
  }) {
    await this.verifyRole(roleId)
    return this.roleRepo.assignPermissions({ roleId, permissionIds, updatedById })
  }

  async delete({ id, deletedById }: { id: string; deletedById: string }) {
    await this.verifyRole(id)
    // soft delete
    await this.roleRepo.delete({ id, deletedById })
    return { message: 'Delete successfully' }
  }
}
