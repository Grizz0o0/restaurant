import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { Env } from '@/env.validation'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: Redis

  constructor(private readonly configService: ConfigService<Env, true>) {
    const host = this.configService.get('REDIS_HOST', { infer: true })
    const port = this.configService.get('REDIS_PORT', { infer: true })
    const password = this.configService.get('REDIS_PASSWORD', { infer: true })

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) {
          this.logger.warn('Redis reconnection attempts exhausted.')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    this.client.on('connect', () => {
      this.logger.log(`[Redis] Connected successfully to ${host}:${port}`)
    })

    this.client.on('error', (err) => {
      this.logger.error(`[Redis] Error: ${err.message}`, err.stack)
    })
  }

  async onModuleInit() {
    try {
      if (this.client.status !== 'ready' && this.client.status !== 'connecting') {
        await this.client.connect()
      }
    } catch (err) {
      this.logger.error(`[Redis] Failed initial connection: ${(err as Error).message}`)
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
      this.logger.log('[Redis] Connection closed.')
    }
  }

  /**
   * Lấy instance Redis client gốc nếu cần thực hiện lệnh nâng cao
   */
  getClient(): Redis {
    return this.client
  }

  /**
   * Lấy giá trị từ Redis theo key, tự động parse JSON đúng kiểu
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key)
      if (data === null) return null

      try {
        return JSON.parse(data) as T
      } catch {
        return data as unknown as T
      }
    } catch (err) {
      this.logger.error(`Failed to GET key "${key}": ${(err as Error).message}`)
      return null
    }
  }

  /**
   * Lưu giá trị vào Redis kèm TTL (thời gian sống tính bằng giây)
   * Sử dụng JSON.stringify cho mọi kiểu dữ liệu để đảm bảo tính đối xứng khi get
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (err) {
      this.logger.error(`Failed to SET key "${key}": ${(err as Error).message}`)
    }
  }

  /**
   * Xóa một key cụ thể
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (err) {
      this.logger.error(`Failed to DEL key "${key}": ${(err as Error).message}`)
    }
  }

  /**
   * Xóa tất cả các key khớp với pattern (ví dụ: 'dish:*')
   * Sử dụng for await...of trên scanStream để tự động hóa backpressure
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      })

      for await (const resultKeys of stream) {
        const keys = resultKeys as string[]
        if (keys.length > 0) {
          const pipeline = this.client.pipeline()
          keys.forEach((key) => pipeline.del(key))
          await pipeline.exec()
        }
      }
    } catch (err) {
      this.logger.error(`Failed to DEL pattern "${pattern}": ${(err as Error).message}`)
      throw err
    }
  }
}
