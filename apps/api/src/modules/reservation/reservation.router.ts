import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import {
  CreateReservationBodySchema,
  UpdateReservationBodySchema,
  GetReservationsQuerySchema,
  ReservationSchema,
  GetReservationsResSchema,
  CheckAvailabilityQuerySchema,
} from '@repo/schema'
import { ReservationService } from './reservation.service'
import { z } from 'zod'

@Injectable()
export class ReservationRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly reservationService: ReservationService,
  ) {}

  get router() {
    const { t, protectedProcedure: prot } = this.trpcService
    return t.router({
      list: prot
        .input(GetReservationsQuerySchema)
        .output(GetReservationsResSchema)
        .query(async ({ input }) => {
          const result = await this.reservationService.list(input)
          return result
        }),

      checkAvailability: prot
        .input(CheckAvailabilityQuerySchema)
        .output(z.object({ available: z.boolean() }))
        .query(async ({ input }) => {
          const result = await this.reservationService.getAvailability(input)
          return result
        }),

      create: prot
        .input(CreateReservationBodySchema)
        .output(ReservationSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.reservationService.create({
            ...input,
            userId: ctx.user!.userId,
          })
          return result
        }),

      update: prot
        .input(z.object({ id: z.string(), data: UpdateReservationBodySchema }))
        .output(ReservationSchema)
        .mutation(async ({ input, ctx }) => {
          const result = await this.reservationService.update(input.id, {
            ...input.data,
            updatedById: ctx.user!.userId,
          })
          return result
        }),
    })
  }
}
