import { NextResponse } from "next/server";
import { z } from "zod";
import { routeError } from "@/lib/api/route-errors";
import { BookingService } from "@/modules/bookings/application/booking-service";
import { currentAccount } from "@/modules/identity/application/current-authorization";

function bookingId(value: string) {
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) return null;
  return parsed.data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const id = bookingId((await params).bookingId);
    if (!id) return NextResponse.json({ detail: "Booking not found.", code: "BOOKING_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(await new BookingService().get(await currentAccount(), id), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return routeError(cause);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const id = bookingId((await params).bookingId);
    if (!id) return NextResponse.json({ detail: "Booking not found.", code: "BOOKING_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(await new BookingService().cancel(await currentAccount(), id));
  } catch (cause) {
    return routeError(cause);
  }
}
