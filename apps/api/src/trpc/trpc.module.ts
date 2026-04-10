import { Global, Module } from '@nestjs/common'
import { AuthMiddleware } from './middlewares/auth.middleware'
import { AdminRoleMiddleware } from './middlewares/admin-role.middleware'
import { StaffRoleMiddleware } from './middlewares/staff-role.middleware'
import { DynamicAuthMiddleware } from './middlewares/dynamic-auth.middleware'
import { TrpcService } from './trpc.service'

@Global()
@Module({
  providers: [
    TrpcService,
    AuthMiddleware,
    AdminRoleMiddleware,
    StaffRoleMiddleware,
    DynamicAuthMiddleware,
  ],
  exports: [
    TrpcService,
    AuthMiddleware,
    AdminRoleMiddleware,
    StaffRoleMiddleware,
    DynamicAuthMiddleware,
  ],
})
export class TrpcModule {}
