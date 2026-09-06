import { z } from "zod";

export const createNotificationSchema = z.object({
  type: z.string().optional(),
  content: z.string().min(1),
});

export const updateNotificationSchema = z.object({
  hasRead: z.boolean(),
});

export type CreateNotificationDto = z.infer<
  typeof createNotificationSchema
>;
export type UpdateNotificationDto = z.infer<
  typeof updateNotificationSchema
>;