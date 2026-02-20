import { initTRPC } from '@trpc/server';
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
    GetRestaurantStaffResSchema,
    CreateRestaurantStaffBodySchema,
    UpdateRestaurantStaffBodySchema,
    CreateInventoryDishBodySchema,
    UpdateInventoryDishBodySchema,
    GetDishIngredientsResSchema,
} from '@repo/schema';
import superjson from 'superjson';
const t = initTRPC.create({ transformer: superjson });
const publicProcedure = t.procedure;
const appRouter = t.router({
    auth: t.router({
        register: publicProcedure
            .input(RegisterBodySchema)
            .output(RegisterResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        login: publicProcedure
            .input(LoginBodySchema)
            .output(LoginResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        refreshToken: publicProcedure
            .input(RefreshTokenBodySchema)
            .output(RefreshTokenResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        sendOTP: publicProcedure
            .input(SendOTPBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        logout: publicProcedure
            .input(LogoutBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        forgotPassword: publicProcedure
            .input(ForgotPasswordBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        googleUrl: publicProcedure
            .output(GetAuthorizationUrlResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        googleCallback: publicProcedure
            .input(GoogleCallbackBodySchema)
            .output(LoginResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        getActiveSessions: publicProcedure
            .output(GetSessionsResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        revokeSession: publicProcedure
            .input(RevokeSessionBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        revokeAllSessions: publicProcedure
            .output(RevokeAllSessionsResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        changePassword: publicProcedure
            .input(ChangePasswordBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        guestLogin: publicProcedure
            .input(GuestLoginBodySchema)
            .output(LoginResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        setup2FA: publicProcedure
            .output(TwoFactorSetupResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        disable2FA: publicProcedure
            .input(DisableTwoFactorAuthBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    admin: t.router({
        banUser: publicProcedure
            .input(BanUserBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        unbanUser: publicProcedure
            .input(UnbanUserBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        forceLogout: publicProcedure
            .input(ForceLogoutBodySchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        getStats: publicProcedure
            .output(z.any())
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    permission: t.router({
        list: publicProcedure
            .input(GetPermissionsQuerySchema)
            .output(GetPermissionsResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(GetPermissionParamsSchema)
            .output(GetPermissionDetailResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreatePermissionBodySchema)
            .output(GetPermissionDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    params: GetPermissionParamsSchema,
                    body: UpdatePermissionBodySchema,
                }),
            )
            .output(GetPermissionDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(GetPermissionParamsSchema)
            .output(z.object({ message: z.string() }))
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    role: t.router({
        list: publicProcedure
            .input(GetRolesQuerySchema)
            .output(GetRolesResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(GetRoleDetailParamsSchema)
            .output(GetRoleDetailResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateRoleBodySchema)
            .output(GetRoleDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    params: GetRoleDetailParamsSchema,
                    body: UpdateRoleBodySchema,
                }),
            )
            .output(GetRoleDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(GetRoleDetailParamsSchema)
            .output(z.object({ message: z.string() }))
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        assignPermissions: publicProcedure
            .input(AssignPermissionsSchema)
            .output(GetRoleDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    user: t.router({
        list: publicProcedure
            .input(GetUsersQuerySchema)
            .output(GetUsersResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(GetUserDetailParamsSchema)
            .output(UserDetailResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateUserBodySchema)
            .output(UserDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    params: GetUserDetailParamsSchema,
                    body: UpdateUserBodySchema,
                }),
            )
            .output(UserDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(GetUserDetailParamsSchema)
            .output(z.object({ message: z.string() }))
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    profile: t.router({
        getProfile: publicProcedure
            .output(ProfileDetailResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        updateProfile: publicProcedure
            .input(UpdateProfileBodySchema)
            .output(ProfileDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    dish: t.router({
        list: publicProcedure
            .input(GetDishesQuerySchema)
            .output(GetDishesResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(DishDetailResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateDishBodySchema)
            .output(DishDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        checkVariantUpdate: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    UpdateDishBodySchema,
                }),
            )
            .output(z.array(z.object({ id: z.string(), value: z.string() })))
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateDishBodySchema,
                }),
            )
            .output(DishDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    category: t.router({
        list: publicProcedure
            .input(GetCategoriesQuerySchema)
            .output(GetCategoriesResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(CategoryDetailResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateCategoryBodySchema)
            .output(CategoryDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateCategoryBodySchema,
                }),
            )
            .output(CategoryDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    table: t.router({
        list: publicProcedure
            .input(GetTablesQuerySchema)
            .output(GetTablesResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(RestaurantTableSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateTableBodySchema)
            .output(RestaurantTableSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateTableBodySchema,
                }),
            )
            .output(RestaurantTableSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    order: t.router({
        create: publicProcedure
            .input(CreateOrderBodySchema)
            .output(OrderSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        list: publicProcedure
            .input(GetOrdersQuerySchema)
            .output(GetOrdersResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        createFromCart: publicProcedure
            .input(CreateOrderFromCartSchema)
            .output(OrderSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        updateStatus: publicProcedure
            .input(UpdateOrderStatusSchema)
            .output(OrderSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        myOrders: publicProcedure
            .input(GetOrdersQuerySchema)
            .output(GetOrdersResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    notification: t.router({
        sendPush: publicProcedure
            .input(SendPushNotificationSchema)
            .output(SendPushNotificationSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        getNotifications: publicProcedure
            .output(z.array(NotificationSchema))
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        markAsRead: publicProcedure
            .input(MarkAsReadSchema)
            .output(z.boolean())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    review: t.router({
        create: publicProcedure
            .input(CreateReviewBodySchema)
            .output(ReviewDetailResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        list: publicProcedure
            .input(GetReviewsQuerySchema)
            .output(GetReviewsResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    promotion: t.router({
        create: publicProcedure
            .input(CreatePromotionSchema)
            .output(PromotionSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        list: publicProcedure
            .output(z.array(PromotionSchema))
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        get: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(PromotionSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(z.object({ id: z.string(), data: UpdatePromotionSchema }))
            .output(PromotionSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(PromotionSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        applyCode: publicProcedure
            .input(ApplyPromotionSchema)
            .output(ApplyPromotionResSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    cart: t.router({
        get: publicProcedure
            .output(GetCartResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        add: publicProcedure
            .input(AddCartItemSchema)
            .output(CartItemSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(UpdateCartItemSchema)
            .output(CartItemSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        remove: publicProcedure
            .input(RemoveCartItemSchema)
            .output(CartItemSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    language: t.router({
        list: publicProcedure
            .input(GetLanguagesQuerySchema)
            .output(z.any())
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(LanguageResponseSchema.nullable())
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateLanguageBodySchema)
            .output(LanguageResponseSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateLanguageBodySchema,
                }),
            )
            .output(LanguageResponseSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    restaurant: t.router({
        list: publicProcedure
            .input(GetRestaurantsQuerySchema)
            .output(GetRestaurantsResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        detail: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(RestaurantSchema.extend({ staff: z.any().optional() }))
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateRestaurantBodySchema)
            .output(RestaurantSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateRestaurantBodySchema,
                }),
            )
            .output(RestaurantSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        assignStaff: publicProcedure
            .input(AssignStaffBodySchema)
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        removeStaff: publicProcedure
            .input(RemoveStaffBodySchema)
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    reservation: t.router({
        list: publicProcedure
            .input(GetReservationsQuerySchema)
            .output(GetReservationsResSchema)
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        checkAvailability: publicProcedure
            .input(CheckAvailabilityQuerySchema)
            .output(z.object({ available: z.boolean() }))
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        create: publicProcedure
            .input(CreateReservationBodySchema)
            .output(ReservationSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(
                z.object({
                    id: z.string(),
                    data: UpdateReservationBodySchema,
                }),
            )
            .output(ReservationSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    address: t.router({
        create: publicProcedure
            .input(CreateAddressBodySchema)
            .output(AddressSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        list: publicProcedure
            .input(GetAddressesQuerySchema)
            .output(z.array(AddressSchema))
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        update: publicProcedure
            .input(UpdateAddressBodySchema)
            .output(AddressSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        delete: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(AddressSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        setDefault: publicProcedure
            .input(z.object({ id: z.string() }))
            .output(AddressSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    payment: t.router({
        initiate: publicProcedure
            .input(InitiatePaymentInputSchema)
            .output(InitiatePaymentOutputSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        checkStatus: publicProcedure
            .input(CheckPaymentStatusInputSchema)
            .output(CheckPaymentStatusOutputSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        refund: publicProcedure
            .input(RefundPaymentInputSchema)
            .output(RefundPaymentOutputSchema)
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    restaurantStaff: t.router({
        getStaffs: publicProcedure
            .input(z.object({ restaurantId: z.string().uuid() }))
            .output(z.any())
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        assignStaff: publicProcedure
            .input(
                z.object({
                    restaurantId: z.string().uuid(),
                    data: CreateRestaurantStaffBodySchema,
                }),
            )
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        updateStaffPosition: publicProcedure
            .input(
                z.object({
                    restaurantId: z.string().uuid(),
                    userId: z.string().uuid(),
                    data: UpdateRestaurantStaffBodySchema,
                }),
            )
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        removeStaff: publicProcedure
            .input(
                z.object({
                    restaurantId: z.string().uuid(),
                    userId: z.string().uuid(),
                }),
            )
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
    inventoryDish: t.router({
        getDishIngredients: publicProcedure
            .input(z.object({ dishId: z.string().uuid() }))
            .output(z.any())
            .query(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        addIngredientToDish: publicProcedure
            .input(CreateInventoryDishBodySchema)
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        updateIngredientQuantity: publicProcedure
            .input(
                z.object({
                    inventoryId: z.string().uuid(),
                    dishId: z.string().uuid(),
                    data: UpdateInventoryDishBodySchema,
                }),
            )
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
        removeIngredientFromDish: publicProcedure
            .input(
                z.object({
                    inventoryId: z.string().uuid(),
                    dishId: z.string().uuid(),
                }),
            )
            .output(z.any())
            .mutation(async () => 'PLACEHOLDER_DO_NOT_REMOVE' as any),
    }),
});
export type AppRouter = typeof appRouter;
