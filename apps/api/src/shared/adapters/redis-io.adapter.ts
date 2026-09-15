import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { INestApplicationContext, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from '@/env.validation'

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined
  private readonly logger = new Logger(RedisIoAdapter.name)

  constructor(private readonly app: INestApplicationContext) {
    super(app)
  }

  async connectToRedis(): Promise<void> {
    const configService = this.app.get<ConfigService<Env, true>>(ConfigService)
    const host = configService.get('REDIS_HOST', { infer: true })
    const port = configService.get('REDIS_PORT', { infer: true })
    const password = configService.get('REDIS_PASSWORD', { infer: true }) || undefined

    const redisOptions = {
      host,
      port,
      password,
      retryStrategy: (times: number) => {
        if (times > 5) {
          this.logger.warn('[RedisIoAdapter] Redis reconnection attempts exhausted.')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    }

    const pubClient = new Redis(redisOptions)
    const subClient = pubClient.duplicate()

    pubClient.on('connect', () => {
      this.logger.log(`[RedisIoAdapter] PubClient connected to ${host}:${port}`)
    })
    subClient.on('connect', () => {
      this.logger.log(`[RedisIoAdapter] SubClient connected to ${host}:${port}`)
    })

    pubClient.on('error', (err) => {
      this.logger.error(`[RedisIoAdapter] PubClient error: ${err.message}`)
    })
    subClient.on('error', (err) => {
      this.logger.error(`[RedisIoAdapter] SubClient error: ${err.message}`)
    })

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options)
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor)
      this.logger.log('[RedisIoAdapter] Socket.IO server connected to Redis adapter')
    }
    return server
  }
}