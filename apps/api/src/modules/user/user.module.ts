import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserRepo } from './user.repo'
import { UserRouter } from './user.router'

@Module({
  providers: [UserService, UserRepo, UserRouter],
  exports: [UserService, UserRepo, UserRouter],
})
export class UserModule {}
