import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import {
  CreateReservationBodyType,
  UpdateReservationBodyType,
  GetReservationsQueryType,
  CheckAvailabilityQueryType,
} from '@repo/schema'
import { TRPCError } from '@trpc/server'
import dayjs from 'dayjs'

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(
    tableId: string,
    startTime: Date,
    durationMinutes: number,
    excludeReservationId?: string,
  ): Promise<boolean> {
    const endTime = dayjs(startTime).add(durationMinutes, 'minute').toDate()

    const standardDuration = 120 // minutes

    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        tableId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        AND: [
          {
            reservationTime: {
              lt: endTime,
            },
          },
          {
            reservationTime: {
              gt: dayjs(startTime).subtract(standardDuration, 'minute').toDate(),
            },
          },
        ],
      },
    })

    return !overlapping
  }

  async create(data: CreateReservationBodyType & { userId: string }) {
    const reservationTime = new Date(data.reservationTime)

    // Check table existence
    const table = await this.prisma.restaurantTable.findUnique({ where: { id: data.tableId } })
    if (!table) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Table not found' })
    }

    if (table.capacity < data.guests) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Table capacity (${table.capacity}) is less than guests (${data.guests})`,
      })
    }

    const available = await this.checkAvailability(
      data.tableId,
      reservationTime,
      data.durationMinutes,
      undefined,
    )

    if (!available) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Table is not available at this time' })
    }

    // Default channel if not valid enum string? Zod handles this.

    return this.prisma.reservation.create({
      data: {
        userId: data.userId,
        tableId: data.tableId,
        reservationTime,
        guests: data.guests,
        notes: data.notes,
        channel: data.channel as any, // Cast to Schema Enum
        guestInfo: data.guestInfo,
        status: 'PENDING',
      },
    })
  }

  async update(id: string, data: UpdateReservationBodyType & { updatedById: string }) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } })
    if (!reservation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Reservation not found' })
    }

    if (data.reservationTime) {
      const newTime = new Date(data.reservationTime)
      const available = await this.checkAvailability(reservation.tableId, newTime, 120, id)
      if (!available) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Table is not available at the new time' })
      }
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...data,
        reservationTime: data.reservationTime ? new Date(data.reservationTime) : undefined,
        updatedById: data.updatedById,
      },
    })
  }

  async list(input: GetReservationsQueryType) {
    const { page = 1, limit = 10, startDate, endDate, status, tableId, userId } = input
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (tableId) where.tableId = tableId
    if (userId) where.userId = userId

    if (startDate || endDate) {
      where.reservationTime = {}
      if (startDate) where.reservationTime.gte = new Date(startDate)
      if (endDate) where.reservationTime.lte = new Date(endDate)
    }

    const [items, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reservationTime: 'desc' },
        include: {
          table: true,
          user: true,
        },
      }),
      this.prisma.reservation.count({ where }),
    ])

    return { items, total }
  }

  async getAvailability(query: CheckAvailabilityQueryType) {
    const isAvailable = await this.checkAvailability(
      query.tableId,
      new Date(query.startTime),
      query.durationMinutes,
    )
    return { available: isAvailable }
  }
}
