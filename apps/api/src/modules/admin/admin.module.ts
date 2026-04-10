import { Module } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminRouter } from './admin.router'
import { AuthModule } from '@/modules/auth/auth.module'

@Module({
  providers: [AdminService, AdminRouter],
  imports: [AuthModule],
  exports: [AdminService, AdminRouter],
})
export class AdminModule {}
