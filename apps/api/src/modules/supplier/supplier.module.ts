import { Module } from '@nestjs/common'
import { SupplierService } from './supplier.service'
import { SupplierController } from './supplier.controller'
import { SupplierRouter } from './supplier.router'

@Module({
  controllers: [SupplierController],
  providers: [SupplierService, SupplierRouter],
  exports: [SupplierService, SupplierRouter],
})
export class SupplierModule {}
