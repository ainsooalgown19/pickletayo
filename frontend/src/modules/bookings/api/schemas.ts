import { z } from "zod";

export const createHoldSchema = z.object({
  courtId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
}).refine((value) => new Date(value.startsAt) < new Date(value.endsAt), { message: "Booking start must be before its end." });

export const idempotencyKeySchema = z.string().trim().min(1).max(120);

export const operatorBookingActionSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});
