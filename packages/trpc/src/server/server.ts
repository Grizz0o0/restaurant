import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    RegisterBodySchema,
    RegisterResSchema,
    LoginBodySchema,
    LoginResSchema,
    RefreshTokenBodySchema,
    RefreshTokenResSchema,
    SendOTPBodySchema,
    LogoutBodySchema,
    ForgotPasswordBodySchema,
    GetAuthorizationUrlResSchema,
    GoogleCallbackBodySchema,
    GetSessionsResSchema,
    RevokeSessionBodySchema,
    RevokeAllSessionsResSchema,
    ChangePasswordBodySchema,
    GuestLoginBodySchema,
    TwoFactorSetupResSchema,
    DisableTwoFactorAuthBodySchema,
    BanUserBodySchema,
    UnbanUserBodySchema,
    ForceLogoutBodySchema,
    GetReportQuerySchema,
    GetReportResponseSchema,
    GetPermissionsQuerySchema,
    GetPermissionsResSchema,
    GetPermissionParamsSchema,
    GetPermissionDetailResSchema,
    CreatePermissionBodySchema,
    UpdatePermissionBodySchema,
    GetRolesQuerySchema,
    GetRolesResSchema,
    GetRoleDetailParamsSchema,
    GetRoleDetailResSchema,
    CreateRoleBodySchema,
    UpdateRoleBodySchema,
    AssignPermissionsSchema,
    GetUsersQuerySchema,
    GetUsersResSchema,
    GetUserDetailParamsSchema,
    UserDetailResSchema,
    CreateUserBodySchema,
    UpdateUserBodySchema,
    ProfileDetailResSchema,
    UpdateProfileBodySchema,
    GetDishesQuerySchema,
    GetDishesResSchema,
    DishDetailResSchema,
    CreateDishBodySchema,
    UpdateDishBodySchema,
    GetCategoriesQuerySchema,
    GetCategoriesResSchema,
    CategoryDetailResSchema,
    CreateCategoryBodySchema,
    UpdateCategoryBodySchema,
    GetTablesQuerySchema,
    GetTablesResSchema,
    RestaurantTableSchema,
    CreateTableBodySchema,
    UpdateTableBodySchema,
    CreateOrderBodySchema,
    OrderSchema,
    GetOrdersQuerySchema,
    GetOrdersResSchema,
    CreateOrderFromCartSchema,
    UpdateOrderStatusSchema,
    SendPushNotificationSchema,
    NotificationSchema,
    MarkAsReadSchema,
    CreateReviewBodySchema,
    ReplyReviewBodySchema,
    ReviewDetailResSchema,
    GetReviewsQuerySchema,
    GetReviewsResSchema,
    CreatePromotionSchema,
    PromotionSchema,
    UpdatePromotionSchema,
    ApplyPromotionSchema,
    ApplyPromotionResSchema,
    GetCartResSchema,
    AddCartItemSchema,
    CartItemSchema,
    UpdateCartItemSchema,
    RemoveCartItemSchema,
    GetLanguagesQuerySchema,
    LanguageResponseSchema,
    CreateLanguageBodySchema,
    UpdateLanguageBodySchema,
    GetReservationsQuerySchema,
    GetReservationsResSchema,
    CheckAvailabilityQuerySchema,
    CreateReservationBodySchema,
    ReservationSchema,
    UpdateReservationBodySchema,
    GetRestaurantsQuerySchema,
    GetRestaurantsResSchema,
    RestaurantSchema,
    CreateRestaurantBodySchema,
    UpdateRestaurantBodySchema,
    AssignStaffBodySchema,
    RemoveStaffBodySchema,
    AddressSchema,
    CreateAddressBodySchema,
    UpdateAddressBodySchema,
    GetAddressesQuerySchema,
    InitiatePaymentInputSchema,
    InitiatePaymentOutputSchema,
    CheckPaymentStatusInputSchema,
    CheckPaymentStatusOutputSchema,
    RefundPaymentInputSchema,
    RefundPaymentOutputSchema,
    GetRestaurantStaffParamsSchema,
    CreateRestaurantStaffBodySchema,
    UpdateRestaurantStaffBodySchema,
    CreateInventoryDishBodySchema,
    UpdateInventoryDishBodySchema,
    SendMessageBodySchema,
    GetHistoryParamsSchema,
    GetHistoryResSchema,
    LogInteractionBodySchema,
    TopDishesQuerySchema,
    TopDishesResSchema,
    GetRecommendationsQuerySchema,
    RecommendationResSchema,
    GetConversationsResSchema,
    AiChatBodySchema,
    AiChatResSchema,
    MessageResSchema,
    AdminStatsSchema,
    GetLanguagesResSchema,
    RestaurantStaffSchema,
    GetRestaurantStaffResSchema,
    GetDishIngredientsResSchema,
    InventoryDishSchema,
    MessageSchema,
    GetSuppliersQuerySchema,
    CreateSupplierBodySchema,
    UpdateSupplierBodySchema,
    GetInventoriesQuerySchema,
    CreateInventoryBodySchema,
    UpdateInventoryBodySchema,
    GetInventoryTransactionsQuerySchema,
} from '@repo/schema';

import superjson from 'superjson';
const t = initTRPC.create({ transformer: superjson });
const publicProcedure = t.procedure;

const notImplemented = async () => {
    throw new TRPCError({
        code: 'METHOD_NOT_SUPPORTED',
        message:
            'This @repo/trpc contract procedure is declared but not bound to a concrete backend implementation yet.',
    });
};

const appRouter = t.router({
    auth: t.router({
        register: publicProcedure
            .input(RegisterBodySchema)
            .output(RegisterResSchema)
            .mutation(notImplemented),
        login: publicProcedure
            .input(LoginBodySchema)
            .output(LoginResSchema)
            .mutation(notImplemented),
        refreshToken: publicProcedure
            .input(RefreshTokenBodySchema)
            .output(RefreshTokenResSchema)
            .mutation(notImplemented),
        sendOTP: publicProcedure
            .input(SendOTPBodySchema)
            .mutation(notImplemented),
        logout: publicProcedure
            .input(LogoutBodySchema)
            .mutation(notImplemented),
        forgotPassword: publicProcedure
            .input(ForgotPasswordBodySchema)
            .mutation(notImplemented),
        googleUrl: publicProcedure
            .output(GetAuthorizationUrlResSchema)
            .query(notImplemented),
        googleCallback: publicProcedure
            .input(GoogleCallbackBodySchema)
            .output(LoginResSchema)
            .mutation(notImplemented),
        getActiveSessions: publicProcedure
            .output(GetSessionsResSchema)
            .query(notImplemented),
        revokeSession: publicProcedure
            .input(RevokeSessionBodySchema)
            .mutation(notImplemented),
        revokeAllSessions: publicProcedure
            .output(RevokeAllSessionsResSchema)
            .mutation(notImplemented),
        changePassword: publicProcedure
            .input(ChangePasswordBodySchema)
            .mutation(notImplemented),
        guestLogin: publicProcedure
            .input(GuestLoginBodySchema)
            .output(LoginResSchema)
            .mutation(notImplemented),
        setup2FA: publicProcedure
            .output(TwoFactorSetupResSchema)
            .mutation(notImplemented),
        disable2FA: publicProcedure
            .input(DisableTwoFactorAuthBodySchema)
            .mutation(notImplemented),
    }),
    admin: t.router({
        banUser: publicProcedure
            .input(BanUserBodySchema)
            .mutation(notImplemented),
        unbanUser: publicProcedure
            .input(UnbanUserBodySchema)
            .mutation(notImplemented),
        forceLogout: publicProcedure
            .input(ForceLogoutBodySchema)
            .mutation(notImplemented),
        getStats: publicProcedure
            .output(AdminStatsSchema)
            .query(notImplemented),
        getReport: publicProcedure
            .input(GetReportQuerySchema)
            .output(GetReportResponseSchema)
            .query(notImplemented),
    }),
    permission: t.router({
        list: publicProcedure
            .input(GetPermissionsQuerySchema)
            .output(GetPermissionsResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(GetPermissionParamsSchema)
            .output(GetPermissionDetailResSchema)
            .query(notImplemented),
        create: publicProcedure
            .input(CreatePermissionBodySchema)
            .output(GetPermissionDetailResSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    params: GetPermissionParamsSchema,
                    body: UpdatePermissionBodySchema,
                }),
            )
            .output(GetPermissionDetailResSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(GetPermissionParamsSchema)
            .output(z.object({ message: z.string() }))
            .mutation(notImplemented),
    }),
    role: t.router({
        list: publicProcedure
            .input(GetRolesQuerySchema)
            .output(GetRolesResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(GetRoleDetailParamsSchema)
            .output(GetRoleDetailResSchema)
            .query(notImplemented),
        create: publicProcedure
            .input(CreateRoleBodySchema)
            .output(GetRoleDetailResSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    params: GetRoleDetailParamsSchema,
                    body: UpdateRoleBodySchema,
                }),
            )
            .output(GetRoleDetailResSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(GetRoleDetailParamsSchema)
            .output(z.object({ message: z.string() }))
            .mutation(notImplemented),
        assignPermissions: publicProcedure
            .input(AssignPermissionsSchema)
            .output(GetRoleDetailResSchema)
            .mutation(notImplemented),
    }),
    user: t.router({
        list: publicProcedure
            .input(GetUsersQuerySchema)
            .output(GetUsersResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(GetUserDetailParamsSchema)
            .output(UserDetailResSchema)
            .query(notImplemented),
        create: publicProcedure
            .input(CreateUserBodySchema)
            .output(UserDetailResSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    params: GetUserDetailParamsSchema,
                    body: UpdateUserBodySchema,
                }),
            )
            .output(UserDetailResSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(GetUserDetailParamsSchema)
            .output(z.object({ message: z.string() }))
            .mutation(notImplemented),
    }),
    profile: t.router({
        getProfile: publicProcedure
            .output(ProfileDetailResSchema)
            .query(notImplemented),
        updateProfile: publicProcedure
            .input(UpdateProfileBodySchema)
            .output(ProfileDetailResSchema)
            .mutation(notImplemented),
    }),
    dish: t.router({
        list: publicProcedure
            .input(GetDishesQuerySchema)
            .output(GetDishesResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(DishDetailResSchema)
            .query(notImplemented),
        create: publicProcedure
            .input(CreateDishBodySchema)
            .output(DishDetailResSchema)
            .mutation(notImplemented),
        checkVariantUpdate: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    UpdateDishBodySchema,
                }),
            )
            .output(z.array(z.object({ id: z.string(), value: z.string() })))
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateDishBodySchema,
                }),
            )
            .output(DishDetailResSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    category: t.router({
        list: publicProcedure
            .input(GetCategoriesQuerySchema)
            .output(GetCategoriesResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(CategoryDetailResSchema)
            .query(notImplemented),
        create: publicProcedure
            .input(CreateCategoryBodySchema)
            .output(CategoryDetailResSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateCategoryBodySchema,
                }),
            )
            .output(CategoryDetailResSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    table: t.router({
        list: publicProcedure
            .input(GetTablesQuerySchema)
            .output(GetTablesResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(RestaurantTableSchema)
            .query(notImplemented),
        create: publicProcedure
            .input(CreateTableBodySchema)
            .output(RestaurantTableSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateTableBodySchema,
                }),
            )
            .output(RestaurantTableSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    order: t.router({
        create: publicProcedure
            .input(CreateOrderBodySchema)
            .output(OrderSchema)
            .mutation(notImplemented),
        list: publicProcedure
            .input(GetOrdersQuerySchema)
            .output(GetOrdersResSchema)
            .query(notImplemented),
        createFromCart: publicProcedure
            .input(CreateOrderFromCartSchema)
            .output(OrderSchema)
            .mutation(notImplemented),
        updateStatus: publicProcedure
            .input(UpdateOrderStatusSchema)
            .output(OrderSchema)
            .mutation(notImplemented),
        myOrders: publicProcedure
            .input(GetOrdersQuerySchema)
            .output(GetOrdersResSchema)
            .query(notImplemented),
    }),
    notification: t.router({
        sendPush: publicProcedure
            .input(SendPushNotificationSchema)
            .output(SendPushNotificationSchema)
            .mutation(notImplemented),
        getNotifications: publicProcedure
            .output(z.array(NotificationSchema))
            .query(notImplemented),
        markAsRead: publicProcedure
            .input(MarkAsReadSchema)
            .output(z.boolean())
            .mutation(notImplemented),
    }),
    review: t.router({
        create: publicProcedure
            .input(CreateReviewBodySchema)
            .output(ReviewDetailResSchema)
            .mutation(notImplemented),
        list: publicProcedure
            .input(GetReviewsQuerySchema)
            .output(GetReviewsResSchema)
            .query(notImplemented),
        myReviews: publicProcedure
            .input(GetReviewsQuerySchema)
            .output(GetReviewsResSchema)
            .query(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(MessageResSchema)
            .mutation(notImplemented),
        reply: publicProcedure
            .input(ReplyReviewBodySchema)
            .output(ReviewDetailResSchema)
            .mutation(notImplemented),
    }),
    promotion: t.router({
        create: publicProcedure
            .input(CreatePromotionSchema)
            .output(PromotionSchema)
            .mutation(notImplemented),
        list: publicProcedure
            .output(z.array(PromotionSchema))
            .query(notImplemented),
        get: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(PromotionSchema)
            .query(notImplemented),
        update: publicProcedure
            .input(z.object({ id: z.string(), data: UpdatePromotionSchema }))
            .output(PromotionSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(PromotionSchema)
            .mutation(notImplemented),
        applyCode: publicProcedure
            .input(ApplyPromotionSchema)
            .output(ApplyPromotionResSchema)
            .mutation(notImplemented),
    }),
    cart: t.router({
        get: publicProcedure.output(GetCartResSchema).query(notImplemented),
        add: publicProcedure
            .input(AddCartItemSchema)
            .output(CartItemSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(UpdateCartItemSchema)
            .output(CartItemSchema)
            .mutation(notImplemented),
        remove: publicProcedure
            .input(RemoveCartItemSchema)
            .output(CartItemSchema)
            .mutation(notImplemented),
    }),
    language: t.router({
        list: publicProcedure
            .input(GetLanguagesQuerySchema)
            .output(GetLanguagesResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(LanguageResponseSchema.nullable())
            .query(notImplemented),
        create: publicProcedure
            .input(CreateLanguageBodySchema)
            .output(LanguageResponseSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateLanguageBodySchema,
                }),
            )
            .output(LanguageResponseSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    restaurant: t.router({
        list: publicProcedure
            .input(GetRestaurantsQuerySchema)
            .output(GetRestaurantsResSchema)
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(
                RestaurantSchema.extend({
                    staff: z.array(RestaurantStaffSchema).optional(),
                }),
            )
            .query(notImplemented),
        getMain: publicProcedure.output(RestaurantSchema).query(notImplemented),
        create: publicProcedure
            .input(CreateRestaurantBodySchema)
            .output(RestaurantSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateRestaurantBodySchema,
                }),
            )
            .output(RestaurantSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(MessageResSchema)
            .mutation(notImplemented),
        assignStaff: publicProcedure
            .input(AssignStaffBodySchema)
            .output(MessageResSchema)
            .mutation(notImplemented),
        removeStaff: publicProcedure
            .input(RemoveStaffBodySchema)
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    reservation: t.router({
        list: publicProcedure
            .input(GetReservationsQuerySchema)
            .output(GetReservationsResSchema)
            .query(notImplemented),
        checkAvailability: publicProcedure
            .input(CheckAvailabilityQuerySchema)
            .output(z.object({ available: z.boolean() }))
            .query(notImplemented),
        create: publicProcedure
            .input(CreateReservationBodySchema)
            .output(ReservationSchema)
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateReservationBodySchema,
                }),
            )
            .output(ReservationSchema)
            .mutation(notImplemented),
    }),
    address: t.router({
        create: publicProcedure
            .input(CreateAddressBodySchema)
            .output(AddressSchema)
            .mutation(notImplemented),
        list: publicProcedure
            .input(GetAddressesQuerySchema)
            .output(z.array(AddressSchema))
            .query(notImplemented),
        update: publicProcedure
            .input(UpdateAddressBodySchema)
            .output(AddressSchema)
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(AddressSchema)
            .mutation(notImplemented),
        setDefault: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(AddressSchema)
            .mutation(notImplemented),
    }),
    payment: t.router({
        initiate: publicProcedure
            .input(InitiatePaymentInputSchema)
            .output(InitiatePaymentOutputSchema)
            .mutation(notImplemented),
        checkStatus: publicProcedure
            .input(CheckPaymentStatusInputSchema)
            .output(CheckPaymentStatusOutputSchema)
            .mutation(notImplemented),
        refund: publicProcedure
            .input(RefundPaymentInputSchema)
            .output(RefundPaymentOutputSchema)
            .mutation(notImplemented),
    }),
    restaurantStaff: t.router({
        getStaffs: publicProcedure
            .input(z.object({ restaurantId: z.string().uuid() }))
            .output(GetRestaurantStaffResSchema)
            .query(notImplemented),
        assignStaff: publicProcedure
            .input(
                z.object({
                    restaurantId: z.string().uuid(),
                    data: CreateRestaurantStaffBodySchema,
                }),
            )
            .output(RestaurantStaffSchema)
            .mutation(notImplemented),
        updateStaffPosition: publicProcedure
            .input(
                z.object({
                    restaurantId: z.string().uuid(),
                    userId: z.string().uuid(),
                    data: UpdateRestaurantStaffBodySchema,
                }),
            )
            .output(RestaurantStaffSchema)
            .mutation(notImplemented),
        removeStaff: publicProcedure
            .input(
                z.object({
                    restaurantId: z.string().uuid(),
                    userId: z.string().uuid(),
                }),
            )
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    supplier: t.router({
        list: publicProcedure
            .input(GetSuppliersQuerySchema)
            .output(z.object({
                data: z.array(z.any()),
                pagination: z.object({
                    totalItems: z.number(),
                    totalPages: z.number(),
                    page: z.number(),
                    limit: z.number(),
                    hasNext: z.boolean(),
                    hasPrev: z.boolean(),
                }),
            }))
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .query(notImplemented),
        create: publicProcedure
            .input(CreateSupplierBodySchema)
            .output(z.any())
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateSupplierBodySchema,
                }),
            )
            .output(z.any())
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(notImplemented),
    }),
    inventory: t.router({
        list: publicProcedure
            .input(GetInventoriesQuerySchema)
            .output(z.object({
                data: z.array(z.any()),
                pagination: z.object({
                    totalItems: z.number(),
                    totalPages: z.number(),
                    page: z.number(),
                    limit: z.number(),
                    hasNext: z.boolean(),
                    hasPrev: z.boolean(),
                }),
            }))
            .query(notImplemented),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .query(notImplemented),
        create: publicProcedure
            .input(CreateInventoryBodySchema)
            .output(z.any())
            .mutation(notImplemented),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateInventoryBodySchema,
                }),
            )
            .output(z.any())
            .mutation(notImplemented),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(notImplemented),
        listTransactions: publicProcedure
            .input(GetInventoryTransactionsQuerySchema)
            .output(z.object({
                data: z.array(z.any()),
                pagination: z.object({
                    totalItems: z.number(),
                    totalPages: z.number(),
                    page: z.number(),
                    limit: z.number(),
                    hasNext: z.boolean(),
                    hasPrev: z.boolean(),
                }),
            }))
            .query(notImplemented),
    }),
    inventoryDish: t.router({
        getDishIngredients: publicProcedure
            .input(z.object({ dishId: z.string().uuid() }))
            .output(GetDishIngredientsResSchema)
            .query(notImplemented),
        addIngredientToDish: publicProcedure
            .input(CreateInventoryDishBodySchema)
            .output(InventoryDishSchema)
            .mutation(notImplemented),
        updateIngredientQuantity: publicProcedure
            .input(
                z.object({
                    inventoryId: z.string().uuid(),
                    dishId: z.string().uuid(),
                    data: UpdateInventoryDishBodySchema,
                }),
            )
            .output(InventoryDishSchema)
            .mutation(notImplemented),
        removeIngredientFromDish: publicProcedure
            .input(
                z.object({
                    inventoryId: z.string().uuid(),
                    dishId: z.string().uuid(),
                }),
            )
            .output(MessageResSchema)
            .mutation(notImplemented),
    }),
    message: t.router({
        send: publicProcedure
            .input(SendMessageBodySchema)
            .output(MessageSchema)
            .mutation(notImplemented),
        getHistory: publicProcedure
            .input(GetHistoryParamsSchema)
            .output(GetHistoryResSchema)
            .query(notImplemented),
        getConversations: publicProcedure
            .output(GetConversationsResSchema)
            .query(notImplemented),
        getAdmin: publicProcedure
            .output(z.object({ id: z.string() }).nullable())
            .query(notImplemented),
    }),
    analytics: t.router({
        log: publicProcedure
            .input(LogInteractionBodySchema)
            .output(MessageResSchema)
            .mutation(notImplemented),
        getTopDishes: publicProcedure
            .input(TopDishesQuerySchema)
            .output(TopDishesResSchema)
            .query(notImplemented),
    }),
    recommendation: t.router({
        getForUser: publicProcedure
            .input(GetRecommendationsQuerySchema)
            .output(RecommendationResSchema)
            .query(notImplemented),
        getTopSelling: publicProcedure
            .input(GetRecommendationsQuerySchema)
            .output(RecommendationResSchema)
            .query(notImplemented),
    }),
    aiChat: t.router({
        chat: publicProcedure
            .input(AiChatBodySchema)
            .output(AiChatResSchema)
            .mutation(notImplemented),
    }),
});
export type AppRouter = typeof appRouter;
