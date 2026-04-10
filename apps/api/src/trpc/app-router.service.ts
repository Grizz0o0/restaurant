import { Injectable } from '@nestjs/common'
import { TrpcService } from './trpc.service'
import { AuthRouter } from '@/modules/auth/auth.router'
import { AdminRouter } from '@/modules/admin/admin.router'
import { UserRouter } from '@/modules/user/user.router'
import { RoleRouter } from '@/modules/role/role.router'
import { PermissionRouter } from '@/modules/permission/permission.router'
import { DishRouter } from '@/modules/dish/dish.router'
import { CategoryRouter } from '@/modules/category/category.router'
import { TableRouter } from '@/modules/table/table.router'
import { OrderRouter } from '@/modules/order/order.router'
import { CartRouter } from '@/modules/cart/cart.router'
import { ProfileRouter } from '@/modules/profile/profile.router'
import { InventoryRouter } from '@/modules/inventory/inventory.router'
import { InventoryDishRouter } from '@/modules/inventory-dish/inventory-dish.router'
import { PromotionRouter } from '@/modules/promotion/promotion.router'
import { SupplierRouter } from '@/modules/supplier/supplier.router'
import { RestaurantRouter } from '@/modules/restaurant/restaurant.router'
import { RestaurantStaffRouter } from '@/modules/restaurant-staff/restaurant-staff.router'
import { ReservationRouter } from '@/modules/reservation/reservation.router'
import { ReviewRouter } from '@/modules/review/review.router'
import { NotificationRouter } from '@/modules/notification/notification.router'
import { MessageRouter } from '@/modules/message/message.router'
import { AddressRouter } from '@/modules/address/address.router'
import { PaymentRouter } from '@/modules/payment/payment.router'
import { AiChatRouter } from '@/modules/ai-chat/ai-chat.router'
import { AnalyticsRouter } from '@/modules/analytics/analytics.router'
import { RecommendationRouter } from '@/modules/recommendation/recommendation.router'
import { LanguageRouter } from '@/modules/language/language.router'
import { ContactRouter } from '@/modules/contact/contact.router'

@Injectable()
export class AppRouterService {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly authRouter: AuthRouter,
    private readonly adminRouter: AdminRouter,
    private readonly userRouter: UserRouter,
    private readonly roleRouter: RoleRouter,
    private readonly permissionRouter: PermissionRouter,
    private readonly dishRouter: DishRouter,
    private readonly categoryRouter: CategoryRouter,
    private readonly tableRouter: TableRouter,
    private readonly orderRouter: OrderRouter,
    private readonly cartRouter: CartRouter,
    private readonly profileRouter: ProfileRouter,
    private readonly inventoryRouter: InventoryRouter,
    private readonly inventoryDishRouter: InventoryDishRouter,
    private readonly promotionRouter: PromotionRouter,
    private readonly supplierRouter: SupplierRouter,
    private readonly restaurantRouter: RestaurantRouter,
    private readonly restaurantStaffRouter: RestaurantStaffRouter,
    private readonly reservationRouter: ReservationRouter,
    private readonly reviewRouter: ReviewRouter,
    private readonly notificationRouter: NotificationRouter,
    private readonly messageRouter: MessageRouter,
    private readonly addressRouter: AddressRouter,
    private readonly paymentRouter: PaymentRouter,
    private readonly aiChatRouter: AiChatRouter,
    private readonly analyticsRouter: AnalyticsRouter,
    private readonly recommendationRouter: RecommendationRouter,
    private readonly languageRouter: LanguageRouter,
    private readonly contactRouter: ContactRouter,
  ) {}

  get appRouter() {
    const { t } = this.trpcService
    return t.router({
      auth: this.authRouter.router,
      admin: this.adminRouter.router,
      user: this.userRouter.router,
      role: this.roleRouter.router,
      permission: this.permissionRouter.router,
      dish: this.dishRouter.router,
      category: this.categoryRouter.router,
      table: this.tableRouter.router,
      order: this.orderRouter.router,
      cart: this.cartRouter.router,
      profile: this.profileRouter.router,
      inventory: this.inventoryRouter.router,
      inventoryDish: this.inventoryDishRouter.router,
      promotion: this.promotionRouter.router,
      supplier: this.supplierRouter.router,
      restaurant: this.restaurantRouter.router,
      restaurantStaff: this.restaurantStaffRouter.router,
      reservation: this.reservationRouter.router,
      review: this.reviewRouter.router,
      notification: this.notificationRouter.router,
      message: this.messageRouter.router,
      address: this.addressRouter.router,
      payment: this.paymentRouter.router,
      aiChat: this.aiChatRouter.router,
      analytics: this.analyticsRouter.router,
      recommendation: this.recommendationRouter.router,
      language: this.languageRouter.router,
      contact: this.contactRouter.router,
    })
  }
}

export type AppRouter = AppRouterService['appRouter']
