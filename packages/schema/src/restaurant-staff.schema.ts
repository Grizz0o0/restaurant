import { z } from 'zod';
import { StaffPositionSchema } from './restaurant.schema';

export const RestaurantStaffSchema = z.object({
    restaurantId: z.string().uuid(),
    userId: z.string().uuid(),
    position: StaffPositionSchema,
});

export const CreateRestaurantStaffBodySchema = z.object({
    userId: z.string().uuid(),
    position: StaffPositionSchema,
});

export const UpdateRestaurantStaffBodySchema = z.object({
    position: StaffPositionSchema,
});

export const GetRestaurantStaffParamsSchema = z.object({
    restaurantId: z.string().uuid(),
    userId: z.string().uuid(),
});

export const GetRestaurantStaffResSchema = z.object({
    data: z.array(RestaurantStaffSchema),
});

export type RestaurantStaff = z.infer<typeof RestaurantStaffSchema>;
export type CreateRestaurantStaffBodyType = z.infer<
    typeof CreateRestaurantStaffBodySchema
>;
export type UpdateRestaurantStaffBodyType = z.infer<
    typeof UpdateRestaurantStaffBodySchema
>;
export type GetRestaurantStaffParamsType = z.infer<
    typeof GetRestaurantStaffParamsSchema
>;
export type GetRestaurantStaffResType = z.infer<
    typeof GetRestaurantStaffResSchema
>;
