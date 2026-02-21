import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { envSchema, Env } from './env.validation'
import { TRPCModule } from 'nestjs-trpc'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './modules/auth/auth.module'
import { SharedModule } from '@/shared/shared.module'
import { TrpcModule } from './trpc/trpc.module'
import { PermissionModule } from '@/modules/permission/permission.module'
import { RoleModule } from '@/modules/role/role.module'
import { AdminModule } from '@/modules/admin/admin.module'
import { UserModule } from '@/modules/user/user.module'
import { ProfileModule } from '@/modules/profile/profile.module'
import { SocketModule } from './modules/socket/socket.module'
import { DishModule } from './modules/dish/dish.module'
import { CategoryModule } from './modules/category/category.module'
import { UploadModule } from './modules/upload/upload.module'
import { TableModule } from './modules/table/table.module'
import { OrderModule } from './modules/order/order.module'
import { ReviewModule } from './modules/review/review.module'
import { PromotionModule } from './modules/promotion/promotion.module'
import { NotificationModule } from './modules/notification/notification.module'
import { CartModule } from './modules/cart/cart.module'
import { LanguageModule } from './modules/language/language.module'
import { MessageModule } from './modules/message/message.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { RecommendationModule } from './modules/recommendation/recommendation.module'
import { SupplierModule } from './modules/supplier/supplier.module'
import { InventoryModule } from './modules/inventory/inventory.module'
import { InventoryTransactionModule } from './modules/inventory-transaction/inventory-transaction.module'
import { InventoryDishModule } from './modules/inventory-dish/inventory-dish.module'
import { RestaurantModule } from './modules/restaurant/restaurant.module'
import { RestaurantStaffModule } from './modules/restaurant-staff/restaurant-staff.module'
import { ReservationModule } from './modules/reservation/reservation.module'
import { AddressModule } from './modules/address/address.module'
import { PaymentModule } from './modules/payment/payment.module'

import { EventEmitterModule } from '@nestjs/event-emitter'

import { AppContext } from './trpc/context'
import SuperJSON from 'superjson'
// import * as Schema from '@repo/schema'

@Module({
  imports: [
    SharedModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      validate: (config) => envSchema.parse(config),
      isGlobal: true,
    }),
    TRPCModule.forRoot({
      transformer: SuperJSON,
      context: AppContext,
      basePath: '/v1/api/trpc',
    }),
    AuthModule,
    AdminModule,
    PermissionModule,
    RoleModule,
    UserModule,
    ProfileModule,
    TrpcModule,
    SocketModule,
    DishModule,
    CategoryModule,
    UploadModule,
    TableModule,
    OrderModule,
    ReviewModule,
    PromotionModule,
    NotificationModule,
    NotificationModule,
    CartModule,
    MessageModule,
    AnalyticsModule,
    RecommendationModule,
    LanguageModule,
    SupplierModule,
    InventoryModule,
    InventoryTransactionModule,
    InventoryDishModule,
    RestaurantModule,
    RestaurantStaffModule,
    ReservationModule,
    AddressModule,
    PaymentModule,

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppContext,
  ],
})
export class AppModule {}
