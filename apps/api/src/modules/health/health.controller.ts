import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { RedisService } from '@/shared/services/redis.service'

@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check() {
    let dbStatus = 'UP'
    let redisStatus = 'UP'

    try {
      await this.prismaService.$queryRaw`SELECT 1`
    } catch (err) {
      dbStatus = 'DOWN'
    }

    try {
      const ping = await this.redisService.getClient().ping()
      if (ping !== 'PONG') redisStatus = 'DOWN'
    } catch (err) {
      redisStatus = 'DOWN'
    }

    const isHealthy = dbStatus === 'UP' && redisStatus === 'UP'

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    }
  }
}
