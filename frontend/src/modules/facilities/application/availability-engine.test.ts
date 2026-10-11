import { describe, expect, it } from "vitest";
import { generateAvailability, zonedDateTimeToInstant, type AvailabilityCourt } from "./availability-engine";

function court(overrides: Partial<AvailabilityCourt> = {}): AvailabilityCourt {
  return {
    courtId: "court-1",
    courtName: "Court 1",
    baseHourlyRate: 600,
    currencyCode: "PHP",
    rateRules: [],
    blocks: [],
    reservations: [],
    ...overrides,
  };
}

describe("availability engine", () => {
  it("generates 30-minute-start slots in the facility timezone", () => {
    const slots = generateAvailability({ date: "2026-10-05", timezone: "Asia/Manila", durationMinutes: 60, opensAtMinutes: 8 * 60, closesAtMinutes: 10 * 60, now: new Date("2026-10-04T00:00:00Z"), courts: [court()] });

    expect(slots.map((slot) => slot.startsAt)).toEqual([
      "2026-10-05T00:00:00.000Z",
      "2026-10-05T00:30:00.000Z",
      "2026-10-05T01:00:00.000Z",
    ]);
  });

  it("removes slots overlapping closures and active reservations", () => {
    const slots = generateAvailability({
      date: "2026-10-05", timezone: "Asia/Manila", durationMinutes: 60, opensAtMinutes: 8 * 60, closesAtMinutes: 11 * 60, now: new Date("2026-10-04T00:00:00Z"),
      courts: [court({
        blocks: [{ startsAt: new Date("2026-10-05T00:30:00Z"), endsAt: new Date("2026-10-05T01:00:00Z") }],
        reservations: [{ startsAt: new Date("2026-10-05T02:00:00Z"), endsAt: new Date("2026-10-05T03:00:00Z") }],
      })],
    });

    expect(slots.map((slot) => slot.startsAt)).toEqual(["2026-10-05T01:00:00.000Z"]);
  });

  it("uses the highest-priority matching rate and prorates the duration", () => {
    const slots = generateAvailability({
      date: "2026-10-05", timezone: "Asia/Manila", durationMinutes: 90, opensAtMinutes: 17 * 60, closesAtMinutes: 20 * 60, now: new Date("2026-10-04T00:00:00Z"),
      courts: [court({ rateRules: [
        { dayOfWeek: 1, startsAtMinutes: 17 * 60, endsAtMinutes: 22 * 60, hourlyRate: 800, effectiveFrom: null, effectiveUntil: null, priority: 1 },
        { dayOfWeek: 1, startsAtMinutes: 17 * 60, endsAtMinutes: 18 * 60, hourlyRate: 900, effectiveFrom: "2026-10-01", effectiveUntil: "2026-10-31", priority: 10 },
      ] })],
    });

    expect(slots[0].price).toBe(1350);
    expect(slots[1].price).toBe(1350);
    expect(slots[2].price).toBe(1200);
  });

  it("does not return slots that have already started", () => {
    const slots = generateAvailability({ date: "2026-10-05", timezone: "Asia/Manila", durationMinutes: 60, opensAtMinutes: 8 * 60, closesAtMinutes: 10 * 60, now: new Date("2026-10-05T00:30:00Z"), courts: [court()] });
    expect(slots.map((slot) => slot.startsAt)).toEqual(["2026-10-05T01:00:00.000Z"]);
  });

  it("converts local times correctly across a daylight-saving boundary", () => {
    expect(zonedDateTimeToInstant("2026-03-09", 9 * 60, "America/New_York").toISOString()).toBe("2026-03-09T13:00:00.000Z");
  });
});
