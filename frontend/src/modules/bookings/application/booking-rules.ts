import { ApplicationError } from "@/lib/api/route-errors";

export function bookingDurationMinutes(startsAt: Date, endsAt: Date, now: Date) {
  if (startsAt <= now || startsAt >= endsAt) {
    throw new ApplicationError(422, "INVALID_BOOKING_PERIOD", "Booking period must be valid and in the future.");
  }
  const duration = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (!Number.isInteger(duration) || duration < 30 || duration > 240 || duration % 30 !== 0) {
    throw new ApplicationError(422, "INVALID_DURATION", "Booking duration must be 30-240 minutes in 30-minute increments.");
  }
  return duration;
}

export function assertCancellable(status: string) {
  if (!["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(status)) {
    throw new ApplicationError(409, "INVALID_BOOKING_STATE", "Booking cannot be cancelled from its current state.");
  }
}

export function assertCheckInAllowed(status: string) {
  if (status !== "CONFIRMED") {
    throw new ApplicationError(409, "INVALID_BOOKING_STATE", "Only a confirmed booking can be checked in.");
  }
}

export function bookingReference(now: Date, suffix: string) {
  return `PT-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${suffix.slice(0, 8).toUpperCase()}`;
}
