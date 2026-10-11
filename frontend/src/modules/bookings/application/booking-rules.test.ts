import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/lib/api/route-errors";
import { assertCancellable, assertCheckInAllowed, bookingDurationMinutes, bookingReference } from "./booking-rules";

describe("booking rules", () => {
  const now = new Date("2026-10-03T00:00:00.000Z");

  it("accepts future durations in 30-minute increments", () => {
    expect(bookingDurationMinutes(new Date("2026-10-03T01:00:00Z"), new Date("2026-10-03T02:30:00Z"), now)).toBe(90);
  });

  it("rejects past and unsupported durations", () => {
    expect(() => bookingDurationMinutes(new Date("2026-10-02T01:00:00Z"), new Date("2026-10-02T02:00:00Z"), now)).toThrowError(ApplicationError);
    expect(() => bookingDurationMinutes(new Date("2026-10-03T01:00:00Z"), new Date("2026-10-03T01:45:00Z"), now)).toThrowError(/30-minute increments/);
  });

  it("limits cancellation to active player booking states", () => {
    expect(() => assertCancellable("HOLD")).not.toThrow();
    expect(() => assertCancellable("CONFIRMED")).not.toThrow();
    expect(() => assertCancellable("EXPIRED")).toThrowError(/cannot be cancelled/);
  });

  it("limits check-in to confirmed bookings", () => {
    expect(() => assertCheckInAllowed("CONFIRMED")).not.toThrow();
    expect(() => assertCheckInAllowed("HOLD")).toThrowError(/confirmed booking/i);
  });

  it("creates readable booking references", () => {
    expect(bookingReference(now, "abcd1234-rest")).toBe("PT-20261003-ABCD1234");
  });
});
