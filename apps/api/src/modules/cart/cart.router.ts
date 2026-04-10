import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { CartService } from './cart.service'
import {
  AddCartItemSchema,
  UpdateCartItemSchema,
  RemoveCartItemSchema,
  GetCartResSchema,
  CartItemSchema,
} from '@repo/schema'

@Injectable()
export class CartRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly cartService: CartService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      get: prot.output(GetCartResSchema).query(async ({ ctx }) => {
        const result = await this.cartService.getCart(ctx.user!.userId)
        return result
      }),

      add: prot
        .input(AddCartItemSchema)
        .output(CartItemSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.cartService.addToCart(ctx.user!.userId, input)
          return result
        }),

      update: prot
        .input(UpdateCartItemSchema)
        .output(CartItemSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.cartService.updateCartItem(ctx.user!.userId, input)
          return result
        }),

      remove: prot
        .input(RemoveCartItemSchema)
        .output(CartItemSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.cartService.removeFromCart(ctx.user!.userId, input)
          return result
        }),
    })
  }
}
