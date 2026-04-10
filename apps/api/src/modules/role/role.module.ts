import { Module } from '@nestjs/common'
import { RoleService } from './role.service'
import { RoleRepo } from './role.repo'
import { RoleRouter } from './role.router'

@Module({
  providers: [RoleService, RoleRepo, RoleRouter],
  exports: [RoleService, RoleRepo, RoleRouter],
})
export class RoleModule {}
