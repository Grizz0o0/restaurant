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

export const GetReportResponseSchema = z.object({
    totalRevenue: z.number(),
    totalOrders: z.number(),
    avgOrderValue: z.number(),
    dailyRevenue: z.array(DailyRevenueItemSchema),
    topDishes: z.array(TopDishReportItemSchema),
});

export type GetReportResponseType = z.infer<typeof GetReportResponseSchema>;
