import { z } from "zod";

export const createFacilitySchema = z.object({
  name: z.string().trim().min(2).max(160),
  branchCode: z.string().trim().regex(/^[A-Za-z0-9_-]{2,40}$/).transform((value) => value.toUpperCase()),
  description: z.string().trim().max(2000).optional().default(""),
  contactNumber: z.string().trim().max(40).optional().default(""),
  contactEmail: z.union([z.literal(""), z.string().email().max(320)]).optional().default(""),
  timezone: z.string().trim().min(3).max(60).default("Asia/Manila"),
  location: z.object({
    addressLine1: z.string().trim().min(2).max(200), addressLine2: z.string().trim().max(200).optional().default(""),
    barangay: z.string().trim().max(120).optional().default(""), city: z.string().trim().min(2).max(120),
    province: z.string().trim().min(2).max(120), postalCode: z.string().trim().max(20).optional().default(""),
    latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
    directionsLandmark: z.string().trim().max(500).optional().default(""),
  }),
});
export const facilityStatusSchema = z.object({ status: z.enum(["DRAFT", "ACTIVE", "TEMPORARILY_CLOSED", "CLOSED"]) });
export const createCourtSchema = z.object({ code: z.string().trim().min(1).max(40).transform((v) => v.toUpperCase()), name: z.string().trim().min(2).max(120), type: z.enum(["INDOOR", "OUTDOOR", "COVERED"]), surfaceType: z.string().trim().min(2).max(80), lighting: z.boolean(), baseHourlyRate: z.number().nonnegative().max(100000) });
export const operatingHoursSchema = z.object({ dayOfWeek: z.number().int().min(1).max(7), closed: z.boolean(), opensAt: z.string().regex(/^\d{2}:\d{2}$/).nullable(), closesAt: z.string().regex(/^\d{2}:\d{2}$/).nullable() }).refine((v) => v.closed || Boolean(v.opensAt && v.closesAt && v.opensAt < v.closesAt), "Opening time must be before closing time.");
export const rateRuleSchema = z.object({ name: z.string().trim().min(2).max(120), dayOfWeek: z.number().int().min(1).max(7).nullable(), startsAt: z.string().regex(/^\d{2}:\d{2}$/).nullable(), endsAt: z.string().regex(/^\d{2}:\d{2}$/).nullable(), hourlyRate: z.number().nonnegative().max(100000), effectiveFrom: z.string().date().nullable(), effectiveUntil: z.string().date().nullable(), priority: z.number().int().min(-1000).max(1000) });
export const availabilityBlockSchema = z.object({ type: z.enum(["MAINTENANCE", "OWNER_BLOCK", "TOURNAMENT", "CLOSURE"]), startsAt: z.string().datetime(), endsAt: z.string().datetime(), reason: z.string().trim().max(500).optional().default("") }).refine((v) => new Date(v.startsAt) < new Date(v.endsAt), "Block start must be before its end.");
export const availabilityQuerySchema = z.object({ date: z.string().date(), durationMinutes: z.coerce.number().int().min(30).max(240).refine((value) => value % 30 === 0, "Duration must use 30-minute increments.").default(60) });
