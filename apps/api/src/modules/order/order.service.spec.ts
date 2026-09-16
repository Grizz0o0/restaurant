import { Test, TestingModule } from '@nestjs/testing'
import { OrderService } from './order.service'
import { OrderRepo } from './order.repo'
import { DishRepo } from '@/modules/dish/dish.repo'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { NotificationService } from '../notification/notification.service'
import { AddressRepo } from '@/modules/address/address.repo'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { RoleName } from '@repo/constants'

describe('OrderService', () => {
  let service: OrderService
  let orderRepo: Partial<Record<keyof OrderRepo, jest.Mock>>
  let prismaService: { $transaction: jest.Mock }

  beforeEach(async () => {
    orderRepo = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    }

    prismaService = {
      $transaction: jest.fn((callback) => callback({})),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepo, useValue: orderRepo },
        { provide: DishRepo, useValue: {} },
        { provide: PrismaService, useValue: prismaService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: NotificationService, useValue: { sendToUser: jest.fn() } },
        { provide: AddressRepo, useValue: {} },
      ],
    }).compile()

    service = module.get<OrderService>(OrderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('updateStatus', () => {
    it('should throw BadRequestException if order does not exist', async () => {
      orderRepo.findById?.mockResolvedValue(null)

      await expect(
        service.updateStatus('invalid-id', 'PROCESSING', 'user-1', RoleName.Admin),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw ForbiddenException if user role is not allowed', async () => {
      orderRepo.findById?.mockResolvedValue({ id: 'order-1', status: 'PENDING' })

      await expect(
        service.updateStatus('order-1', 'PROCESSING', 'user-1', 'Customer' as any),
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
