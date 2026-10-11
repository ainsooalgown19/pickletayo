import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { createIdentityService } from "@/modules/identity/application/create-identity-service";
import { FacilityService } from "@/modules/facilities/application/facility-service";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ facilityId: string }> }) {
  try { const { facilityId } = await params; const account = await (await createIdentityService()).getCurrentAccount(); return NextResponse.json(await new FacilityService().getDetail(facilityId, account)); }
  catch (cause) { return routeError(cause); }
}
