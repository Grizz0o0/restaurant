import { z } from 'zod';

export const BanUserBodySchema = z.object({
    userId: z.string().uuid(),
    reason: z.string().optional(),
});

export type BanUserBodyType = z.infer<typeof BanUserBodySchema>;

export const UnbanUserBodySchema = z.object({
    userId: z.string().uuid(),
});

export type UnbanUserBodyType = z.infer<typeof UnbanUserBodySchema>;

export const ForceLogoutBodySchema = z.object({
    userId: z.string().uuid(),
});

export type ForceLogoutBodyType = z.infer<typeof ForceLogoutBodySchema>;

export const GetReportQuerySchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
});

export type GetReportQueryType = z.infer<typeof GetReportQuerySchema>;

export const DailyRevenueItemSchema = z.object({
    date: z.string(),
    revenue: z.number(),
    orders: z.number(),
});

export const TopDishReportItemSchema = z.object({
    dishName: z.string(),
    totalQuantity: z.number(),
    totalRevenue: z.number(),
});

export const DishReviewScoreSchema = z.object({
    dishName: z.string(),
    avgRating: z.number(),
    reviewCount: z.number(),
});

export const GetReportResponseSchema = z.object({
    totalRevenue: z.number(),
    totalOrders: z.number(),
    avgOrderValue: z.number(),
    dailyRevenue: z.array(DailyRevenueItemSchema),
    topDishes: z.array(TopDishReportItemSchema),
    topRatedDishes: z.array(DishReviewScoreSchema),
    topCriticizedDishes: z.array(DishReviewScoreSchema),
});

export type GetReportResponseType = z.infer<typeof GetReportResponseSchema>;

export const AdminStatsSchema = z.object({
    totalRevenue: z.number(),
    todaysRevenue: z.number(),
    totalOrders: z.number(),
    newOrdersToday: z.number(),
    totalCustomers: z.number(),
    activeDishes: z.number(),
    recentOrders: z.array(
        z.object({
            id: z.string(),
            code: z.string(),
            user: z.string(),
            itemsSummary: z.string(),
            totalAmount: z.number(),
            status: z.string(),
            createdAt: z.date(),
        }),
    ),
});

export type AdminStatsType = z.infer<typeof AdminStatsSchema>;
