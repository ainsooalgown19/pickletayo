import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { createHoldSchema, idempotencyKeySchema } from "@/modules/bookings/api/schemas";
import { BookingService } from "@/modules/bookings/application/booking-service";
import { currentAccount } from "@/modules/identity/application/current-authorization";

export async function POST(request: Request) {
  try {
    const key = idempotencyKeySchema.safeParse(request.headers.get("Idempotency-Key"));
    if (!key.success) return NextResponse.json({ detail: "A valid Idempotency-Key header is required.", code: "IDEMPOTENCY_KEY_REQUIRED" }, { status: 400 });
    const input = createHoldSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ detail: input.error.issues[0]?.message ?? "Enter a valid booking period.", code: "VALIDATION_FAILED" }, { status: 400 });
    return NextResponse.json(await new BookingService().hold(await currentAccount(), key.data, input.data), { status: 201 });
  } catch (cause) {
    return routeError(cause);
  }
}
