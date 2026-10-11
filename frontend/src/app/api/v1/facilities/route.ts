import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { FacilityService } from "@/modules/facilities/application/facility-service";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { const url = new URL(request.url); return NextResponse.json(await new FacilityService().listPublic({ search: url.searchParams.get("query")?.trim() || undefined, city: url.searchParams.get("city")?.trim() || undefined, courtType: url.searchParams.get("courtType")?.trim() || undefined, page: Math.max(0, Number(url.searchParams.get("page")) || 0), size: Math.min(100, Math.max(1, Number(url.searchParams.get("size")) || 20)) })); }
  catch (cause) { return routeError(cause); }
}
