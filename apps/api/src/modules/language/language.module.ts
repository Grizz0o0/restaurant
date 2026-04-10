import { Module } from '@nestjs/common'
import { LanguageService } from './language.service'
import { LanguageRepo } from './language.repo'
import { LanguageRouter } from './language.router'

@Module({
  providers: [LanguageService, LanguageRepo, LanguageRouter],
  exports: [LanguageService, LanguageRouter],
})
export class LanguageModule {}
