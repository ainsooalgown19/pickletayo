import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { BookingService } from "@/modules/bookings/application/booking-service";
import { currentAccount } from "@/modules/identity/application/current-authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get("size")) || 20));
    return NextResponse.json(await new BookingService().list(await currentAccount(), page, size), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return routeError(cause);
  }
}
