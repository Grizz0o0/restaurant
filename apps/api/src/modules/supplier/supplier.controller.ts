import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { SupplierService } from './supplier.service'
import { CreateSupplierBodyType, UpdateSupplierBodyType } from '@repo/schema'

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierBodyType) {
    return this.supplierService.create(createSupplierDto)
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.supplierService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierBodyType) {
    return this.supplierService.update(id, updateSupplierDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierService.remove(id)
  }
}
