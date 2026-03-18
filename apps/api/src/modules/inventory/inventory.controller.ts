import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { InventoryService } from './inventory.service'
import { Prisma } from 'src/generated/prisma/client'
import { CreateInventoryBodyType, LinkDishBodyType, UpdateInventoryBodyType } from '@repo/schema'

@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Body() createInventoryDto: CreateInventoryBodyType) {
    return this.inventoryService.create(createInventoryDto)
  }

  @Post('link-dish')
  linkDish(@Body() body: { inventoryId: string; dishId: string; quantityUsed: number }) {
    return this.inventoryService.linkDish(body.inventoryId, body.dishId, body.quantityUsed)
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.inventoryService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryBodyType) {
    return this.inventoryService.update(id, updateInventoryDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id)
  }
}
