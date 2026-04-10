import { Injectable } from '@nestjs/common'
import { TrpcService } from '@/trpc/trpc.service'
import { ContactService } from './contact.service'
import { CreateContactBodySchema, GetContactsQuerySchema, GetContactsResSchema } from '@repo/schema'
import { z } from 'zod'

@Injectable()
export class ContactRouter {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly contactService: ContactService,
  ) {}

  get router() {
    const { t, publicProcedure, protectedProcedure } = this.trpcService
    return t.router({
      submit: publicProcedure.input(CreateContactBodySchema).mutation(async ({ input }) => {
        return this.contactService.submit(input)
      }),

      list: protectedProcedure
        .input(GetContactsQuerySchema)
        .output(GetContactsResSchema)
        .query(async ({ input }) => {
          return this.contactService.list(input) as any
        }),

      markAsRead: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
          return this.contactService.markAsRead(input.id)
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
          return this.contactService.delete(input.id)
        }),
    })
  }
}
