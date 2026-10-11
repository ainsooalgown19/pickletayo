import { NextResponse } from "next/server";
import { z } from "zod";
import { routeError } from "@/lib/api/route-errors";
import { BookingService } from "@/modules/bookings/application/booking-service";
import { currentAccountWithAnyRole } from "@/modules/identity/application/current-authorization";

export const dynamic = "force-dynamic";

const roles = ["PLATFORM_ADMIN", "CLUB_ADMIN", "COURT_OWNER", "STAFF"] as const;
const bookingStatus = z.enum(["HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get("size")) || 20));
    const query = url.searchParams.get("query")?.slice(0, 100) || undefined;
    const parsedStatus = bookingStatus.safeParse(url.searchParams.get("status"));
    const status = parsedStatus.success ? parsedStatus.data : undefined;
    const account = await currentAccountWithAnyRole(roles);
    return NextResponse.json(await new BookingService().listForOperator(account, page, size, query, status), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return routeError(cause);
  }
}
