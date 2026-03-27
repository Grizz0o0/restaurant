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
  // Tăng timeout để tránh disconnect do network lag
  pingTimeout: 60000,
  pingInterval: 25000,
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

      try {
        const payload = await this.tokenService.verifyAccessToken(token)
        client.data[REQUEST_USER_KEY] = payload

        await client.join(`user:${payload.userId}`)

        this.logger.log(`Client connected: ${client.id} - User: ${payload.userId}`)
      } catch (tokenError: any) {
        if (
          tokenError?.name === 'TokenExpiredError' ||
          tokenError?.message?.includes('expired') ||
          tokenError?.message?.includes('jwt expired')
        ) {
          this.logger.warn(`Token expired for client ${client.id}. Sending token_expired event.`)
          client.emit('token_expired', { message: 'Access token expired. Please refresh.' })
          client.disconnect()
        } else {
          this.logger.error(`Auth error for client ${client.id}: ${tokenError.message}`)
          client.disconnect()
        }
      }
    } catch (error: any) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    this.logger.debug(`Received ping from ${client.id}`)
    client.emit('pong', { message: 'pong', time: new Date() })
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data)
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
