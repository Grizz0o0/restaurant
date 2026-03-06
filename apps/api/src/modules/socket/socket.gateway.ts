import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { TokenService } from '@/shared/services/token.service'
import { REQUEST_USER_KEY } from '@repo/constants'

import envConfig from '@/shared/config'

@WebSocketGateway({
  cors: {
    origin: envConfig.FRONTEND_URL,
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private logger: Logger = new Logger('SocketGateway')

  constructor(private readonly tokenService: TokenService) {}

  afterInit(server: Server) {
    this.logger.log('Init SocketGateway')
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      let token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1]

      if (!token && client.handshake.headers.cookie) {
        const cookies = client.handshake.headers.cookie
          .split(';')
          .reduce((res: Record<string, string>, c: string) => {
            const [key, val] = c.trim().split('=').map(decodeURIComponent)
            res[key] = val
            return res
          }, {})
        token = cookies['accessToken']
      }

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`)
        client.disconnect()
        return
      }

      const payload = await this.tokenService.verifyAccessToken(token)
      client.data[REQUEST_USER_KEY] = payload

      // Join user specific room
      await client.join(`user:${payload.userId}`)

      this.logger.log(`Client connected: ${client.id} - User: ${payload.userId}`)
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    this.logger.log(`Received ping from ${client.id}: ${JSON.stringify(data)}`)
    client.emit('pong', { message: 'Server received your ping!', time: new Date() })
  }

  // Example of emitting to all
  sendToAll(event: string, data: any) {
    this.server.emit(event, data)
  }

  // Example of emitting to a specific user
  sendToUser(userId: string, event: string, data: any) {
    // Note: You might need a mapping of userId to socketId for more efficient targeting
    // For now, this is a simple broadcasting with filter or you can join rooms
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
