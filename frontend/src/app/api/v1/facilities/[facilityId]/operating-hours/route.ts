import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccount } from "@/modules/identity/application/current-authorization";
import { FacilityService } from "@/modules/facilities/application/facility-service";
import { operatingHoursSchema } from "@/modules/facilities/api/schemas";
export async function PUT(request: Request, { params }: { params: Promise<{ facilityId: string }> }) { try { const { facilityId } = await params; const input = operatingHoursSchema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ detail: input.error.issues[0]?.message ?? "Enter valid operating hours.", code: "VALIDATION_FAILED" }, { status: 400 }); const saved = await new FacilityService().setOperatingHours(await currentAccount(), facilityId, input.data); return NextResponse.json(saved); } catch (cause) { return routeError(cause); } }
