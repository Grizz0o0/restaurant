import { HttpException, Injectable, Logger } from '@nestjs/common'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { Context } from './context'
import { AuthMiddleware } from './middlewares/auth.middleware'
import { AdminRoleMiddleware } from './middlewares/admin-role.middleware'
import { StaffRoleMiddleware } from './middlewares/staff-role.middleware'
import { DynamicAuthMiddleware } from './middlewares/dynamic-auth.middleware'
import { Prisma } from 'src/generated/prisma/client'

@Injectable()
export class TrpcService {
  private readonly logger = new Logger('TRPC')

  constructor(
    private readonly authMiddleware: AuthMiddleware,
    private readonly adminRoleMiddleware: AdminRoleMiddleware,
    private readonly staffRoleMiddleware: StaffRoleMiddleware,
    private readonly dynamicAuthMiddleware: DynamicAuthMiddleware,
  ) {}

  readonly t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter: ({ error, shape }) => {
      // 1. Handle NestJS HttpException
      if (error.cause instanceof HttpException) {
        const status = error.cause.getStatus()
        const trpcCode = this.httpStatusToTRPCCode(status)
        return {
          ...shape,
          message: error.cause.message,
          data: {
            ...shape.data,
            code: trpcCode,
            httpStatus: status,
          },
        }
      }

      // 2. Handle Prisma Known Errors
      if (error.cause instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.cause.code === 'P2000') {
          return { ...shape, message: 'Thao tác dữ liệu không hợp lệ', data: { ...shape.data, code: 'BAD_REQUEST', httpStatus: 400 } }
        }
        if (error.cause.code === 'P2002') {
          return { ...shape, message: 'Dữ liệu đã tồn tại hoặc bị trùng lặp', data: { ...shape.data, code: 'CONFLICT', httpStatus: 409 } }
        }
        if (error.cause.code === 'P2025') {
          return { ...shape, message: 'Không tìm thấy dữ liệu yêu cầu', data: { ...shape.data, code: 'NOT_FOUND', httpStatus: 404 } }
        }
      }

      return shape
    },
  })

  private httpStatusToTRPCCode(status: number): TRPCError['code'] {
    switch (status) {
      case 400: return 'BAD_REQUEST'
      case 401: return 'UNAUTHORIZED'
      case 403: return 'FORBIDDEN'
      case 404: return 'NOT_FOUND'
      case 408: return 'TIMEOUT'
      case 409: return 'CONFLICT'
      case 412: return 'PRECONDITION_FAILED'
      case 413: return 'PAYLOAD_TOO_LARGE'
      case 405: return 'METHOD_NOT_SUPPORTED'
      case 422: return 'UNPROCESSABLE_CONTENT'
      case 429: return 'TOO_MANY_REQUESTS'
      case 499: return 'CLIENT_CLOSED_REQUEST'
      case 500: return 'INTERNAL_SERVER_ERROR'
      default: return 'INTERNAL_SERVER_ERROR'
    }
  }

  // GLOBAL LOGGER MIDDLEWARE
  private readonly loggerMiddleware = this.t.middleware(async ({ path, type, next }) => {
    const start = Date.now()
    const result = await next()
    const durationMs = Date.now() - start
    
    if (result.ok) {
      this.logger.log(`[${type}] '${path}' - OK (${durationMs}ms)`)
    } else {
      this.logger.error(`[${type}] '${path}' - FAILED (${durationMs}ms): ${result.error.message}`)
    }
    
    return result
  })

  get publicProcedure() {
    return this.t.procedure.use(this.loggerMiddleware)
  }

  get protectedProcedure() {
    return this.t.procedure.use(this.loggerMiddleware).use((opts) => this.authMiddleware.use(opts))
  }

  get adminProcedure() {
    return this.t.procedure
      .use(this.loggerMiddleware)
      .use((opts) => this.authMiddleware.use(opts))
      .use((opts) => this.adminRoleMiddleware.use(opts))
  }

  get staffProcedure() {
    return this.t.procedure
      .use(this.loggerMiddleware)
      .use((opts) => this.authMiddleware.use(opts))
      .use((opts) => this.staffRoleMiddleware.use(opts))
  }

  get dynamicProcedure() {
    return this.t.procedure
      .use(this.loggerMiddleware)
      .use((opts) => this.authMiddleware.use(opts))
      .use((opts) => this.dynamicAuthMiddleware.use(opts))
  }
}
