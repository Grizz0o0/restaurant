import { Module } from '@nestjs/common'
import { TableService } from './table.service'
import { TableRouter } from './table.router'
import { TableRepo } from './table.repo'

@Module({
  providers: [TableService, TableRouter, TableRepo],
  exports: [TableService, TableRouter],
})
export class TableModule {}
