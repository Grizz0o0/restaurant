import { Module } from '@nestjs/common'
import { AddressService } from './address.service'
import { AddressRepo } from './address.repo'
import { AddressRouter } from './address.router'

@Module({
  imports: [],
  controllers: [],
  providers: [AddressService, AddressRepo, AddressRouter],
  exports: [AddressService, AddressRepo, AddressRouter],
})
export class AddressModule {}
