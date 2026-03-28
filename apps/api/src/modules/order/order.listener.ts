import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { SocketGateway } from '@/modules/socket/socket.gateway'

@Injectable()
export class OrderListener {
  constructor(private readonly socketGateway: SocketGateway) {}

  @OnEvent('order.updated')
  handleOrderUpdatedEvent(payload: { userId?: string; orderId: string; status: string }) {
    if (payload.userId) {
      this.socketGateway.sendToUser(payload.userId, 'order_updated', payload)
    }
  }
}
