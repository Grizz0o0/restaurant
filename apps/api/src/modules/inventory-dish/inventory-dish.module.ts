import { Module } from '@nestjs/common'
import { InventoryDishService } from './inventory-dish.service'
import { InventoryDishRouter } from './inventory-dish.router'

@Module({
  providers: [InventoryDishService, InventoryDishRouter],
  exports: [InventoryDishService, InventoryDishRouter],
})
export class InventoryDishModule {}
