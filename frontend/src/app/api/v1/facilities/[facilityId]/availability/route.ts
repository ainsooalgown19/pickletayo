import { NextResponse } from "next/server";
import { z } from "zod";
import { routeError } from "@/lib/api/route-errors";
import { availabilityQuerySchema } from "@/modules/facilities/api/schemas";
import { FacilityService } from "@/modules/facilities/application/facility-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ facilityId: string }> }) {
  try {
    const { facilityId } = await params;
    if (!z.string().uuid().safeParse(facilityId).success) {
      return NextResponse.json({ detail: "Facility not found.", code: "FACILITY_NOT_FOUND" }, { status: 404 });
    }
    const url = new URL(request.url);
    const query = availabilityQuerySchema.safeParse({
      date: url.searchParams.get("date"),
      durationMinutes: url.searchParams.get("durationMinutes") ?? undefined,
    });
    if (!query.success) {
      return NextResponse.json({ detail: query.error.issues[0]?.message ?? "Enter a valid date and duration.", code: "VALIDATION_FAILED" }, { status: 400 });
    }
    return NextResponse.json(await new FacilityService().availability(facilityId, query.data.date, query.data.durationMinutes), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return routeError(cause);
  }
}
