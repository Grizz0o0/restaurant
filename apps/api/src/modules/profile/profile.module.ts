import { Module } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ProfileRepo } from './profile.repo'
import { ProfileRouter } from './profile.router'

@Module({
  providers: [ProfileService, ProfileRepo, ProfileRouter],
  exports: [ProfileService, ProfileRepo, ProfileRouter],
})
export class ProfileModule {}
