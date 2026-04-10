import { Module } from '@nestjs/common'
import { InventoryService } from './inventory.service'
import { InventoryController } from './inventory.controller'
import { InventoryRouter } from './inventory.router'

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRouter],
  exports: [InventoryService, InventoryRouter],
})
export class InventoryModule {}
