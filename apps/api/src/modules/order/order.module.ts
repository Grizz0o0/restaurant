import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { OrderRouter } from './order.router'
import { OrderRepo } from './order.repo'
import { DishModule } from '@/modules/dish/dish.module'
import { NotificationModule } from '@/modules/notification/notification.module'
// import { NotificationService } from '@/modules/notification/notification.service'
import { AddressModule } from '@/modules/address/address.module'

import { OrderListener } from './order.listener'
import { SocketModule } from '@/modules/socket/socket.module'

@Module({
  imports: [DishModule, NotificationModule, AddressModule, SocketModule],

  providers: [OrderService, OrderRouter, OrderRepo, OrderListener],
  exports: [OrderService],
})
export class OrderModule {}
