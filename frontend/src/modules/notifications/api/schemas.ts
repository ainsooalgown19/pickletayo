import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  bookingUpdates: z.boolean(),
  accountSecurity: z.boolean(),
  productNews: z.boolean(),
});
