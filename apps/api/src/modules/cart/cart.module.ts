import { Module } from '@nestjs/common'
import { CartService } from './cart.service'
import { CartRouter } from './cart.router'

@Module({
  providers: [CartService, CartRouter],
  exports: [CartService, CartRouter],
})
export class CartModule {}
