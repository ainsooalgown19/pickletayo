import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccount } from "@/modules/identity/application/current-authorization";
import { FacilityService } from "@/modules/facilities/application/facility-service";
import { createCourtSchema } from "@/modules/facilities/api/schemas";
export async function POST(request: Request, { params }: { params: Promise<{ facilityId: string }> }) { try { const { facilityId } = await params; const input = createCourtSchema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ detail: "Enter valid court details.", code: "VALIDATION_FAILED" }, { status: 400 }); return NextResponse.json(await new FacilityService().addCourt(await currentAccount(), facilityId, input.data), { status: 201 }); } catch (cause) { return routeError(cause); } }
