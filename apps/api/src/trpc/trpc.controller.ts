import { INestApplication, Injectable } from '@nestjs/common'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { AppRouterService } from './app-router.service'
import { createContext } from './context'

@Injectable()
export class TrpcController {
  constructor(private readonly appRouterService: AppRouterService) {}

  applyMiddleware(app: INestApplication) {
    app.use(
      '/v1/api/trpc',
      createExpressMiddleware({
        router: this.appRouterService.appRouter,
        createContext: ({ req, res }) => createContext({ req, res }),
      }),
    )
  }
}
