import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { LoggingInterceptor } from '@/shared/interceptors/logging.interceptor'
import { ValidationPipe } from '@nestjs/common'
import { PrismaClientExceptionFilter } from '@/shared/filters/prisma-client-exception.filter'
import { HttpAdapterHost } from '@nestjs/core'
import { TransformInterceptor } from '@/shared/interceptors/transform.interceptor'
import { AllExceptionsFilter } from '@/shared/filters/all-exception.filter'
import envConfig from '@/shared/config'
import { TrpcController } from './trpc/trpc.controller'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  const port = envConfig.APP_PORT
  app.setGlobalPrefix('v1/api')
  app.enableCors({
    origin: envConfig.FRONTEND_URL,
    credentials: true,
  })
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

  const trpcController = app.get(TrpcController)
  trpcController.applyMiddleware(app)

  const httpAdapterHost = app.get(HttpAdapterHost)
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost),
    new PrismaClientExceptionFilter(httpAdapterHost.httpAdapter),
  )
  await app.listen(port)
}
bootstrap()
