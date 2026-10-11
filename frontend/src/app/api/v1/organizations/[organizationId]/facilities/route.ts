import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccount } from "@/modules/identity/application/current-authorization";
import { FacilityService } from "@/modules/facilities/application/facility-service";
import { createFacilitySchema } from "@/modules/facilities/api/schemas";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ organizationId: string }> };
export async function GET(request: Request, context: Context) {
  try { const { organizationId } = await context.params; const url = new URL(request.url); const page = Math.max(0, Number(url.searchParams.get("page")) || 0); const size = Math.min(100, Math.max(1, Number(url.searchParams.get("size")) || 20)); return NextResponse.json(await new FacilityService().listForOrganization(await currentAccount(), organizationId, page, size)); }
  catch (cause) { return routeError(cause); }
}
export async function POST(request: Request, context: Context) {
  try { const { organizationId } = await context.params; const input = createFacilitySchema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ detail: "Enter valid facility and location details.", code: "VALIDATION_FAILED", errors: input.error.flatten() }, { status: 400 }); return NextResponse.json(await new FacilityService().create(await currentAccount(), organizationId, input.data), { status: 201 }); }
  catch (cause) { return routeError(cause); }
}
