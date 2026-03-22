import { Global, Module } from '@nestjs/common'
import { AuthMiddleware } from './middlewares/auth.middleware'
import { AdminRoleMiddleware } from './middlewares/admin-role.middleware'
import { StaffRoleMiddleware } from './middlewares/staff-role.middleware'
import { AppContext } from './context'

import { DynamicAuthMiddleware } from './middlewares/dynamic-auth.middleware'

@Global()
@Module({
  providers: [
    AuthMiddleware,
    AdminRoleMiddleware,
    StaffRoleMiddleware,
    DynamicAuthMiddleware,
    AppContext,
  ],
  exports: [
    AppContext,
    AuthMiddleware,
    AdminRoleMiddleware,
    StaffRoleMiddleware,
    DynamicAuthMiddleware,
  ],
})
export class TrpcModule {}
