import { describe, expect, it } from "vitest";
import {
  availabilityBlockSchema,
  availabilityQuerySchema,
  createFacilitySchema,
  operatingHoursSchema,
  rateRuleSchema,
} from "./schemas";

describe("facility command schemas", () => {
  it("normalizes a valid facility branch code", () => {
    const result = createFacilitySchema.parse({
      name: "Pickle Hub Makati",
      branchCode: "makati_01",
      location: {
        addressLine1: "123 Ayala Avenue",
        city: "Makati",
        province: "Metro Manila",
        latitude: 14.5547,
        longitude: 121.0244,
      },
    });

    expect(result.branchCode).toBe("MAKATI_01");
    expect(result.timezone).toBe("Asia/Manila");
  });

  it("rejects operating hours whose closing time is not after opening", () => {
    const result = operatingHoursSchema.safeParse({
      dayOfWeek: 1,
      closed: false,
      opensAt: "18:00",
      closesAt: "08:00",
    });

    expect(result.success).toBe(false);
  });

  it("allows a closed day without opening and closing times", () => {
    expect(
      operatingHoursSchema.safeParse({
        dayOfWeek: 7,
        closed: true,
        opensAt: null,
        closesAt: null,
      }).success,
    ).toBe(true);
  });

  it("rejects availability blocks that end before they start", () => {
    const result = availabilityBlockSchema.safeParse({
      type: "MAINTENANCE",
      startsAt: "2026-10-02T10:00:00.000Z",
      endsAt: "2026-10-02T09:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a bounded date-specific rate rule", () => {
    expect(
      rateRuleSchema.safeParse({
        name: "Weekday peak",
        dayOfWeek: 5,
        startsAt: "17:00",
        endsAt: "22:00",
        hourlyRate: 900,
        effectiveFrom: "2026-10-01",
        effectiveUntil: "2026-12-31",
        priority: 10,
      }).success,
    ).toBe(true);
  });

  it("accepts only 30-minute availability durations", () => {
    expect(availabilityQuerySchema.safeParse({ date: "2026-10-05", durationMinutes: "90" }).success).toBe(true);
    expect(availabilityQuerySchema.safeParse({ date: "2026-10-05", durationMinutes: "45" }).success).toBe(false);
  });
});
