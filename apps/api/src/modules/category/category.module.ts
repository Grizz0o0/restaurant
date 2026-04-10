import { Module } from '@nestjs/common'
import { CategoryService } from './category.service'
import { CategoryRepo } from './category.repo'
import { CategoryRouter } from './category.router'

@Module({
  providers: [CategoryService, CategoryRepo, CategoryRouter],
  exports: [CategoryService, CategoryRepo, CategoryRouter],
})
export class CategoryModule {}
