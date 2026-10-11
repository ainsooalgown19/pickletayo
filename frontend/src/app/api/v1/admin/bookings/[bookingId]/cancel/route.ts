import { NextResponse } from "next/server";
import { z } from "zod";
import { routeError } from "@/lib/api/route-errors";
import { operatorBookingActionSchema } from "@/modules/bookings/api/schemas";
import { BookingService } from "@/modules/bookings/application/booking-service";
import { currentAccountWithAnyRole } from "@/modules/identity/application/current-authorization";

const roles = ["PLATFORM_ADMIN", "CLUB_ADMIN", "COURT_OWNER", "STAFF"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const id = z.string().uuid().safeParse((await params).bookingId);
    if (!id.success) return NextResponse.json({ detail: "Booking not found.", code: "BOOKING_NOT_FOUND" }, { status: 404 });
    const input = operatorBookingActionSchema.safeParse(await request.json().catch(() => ({})));
    if (!input.success) return NextResponse.json({ detail: "Enter a valid cancellation reason.", code: "VALIDATION_FAILED" }, { status: 400 });
    const account = await currentAccountWithAnyRole(roles);
    return NextResponse.json(await new BookingService().cancelForOperator(account, id.data, input.data.reason));
  } catch (cause) {
    return routeError(cause);
  }
}
