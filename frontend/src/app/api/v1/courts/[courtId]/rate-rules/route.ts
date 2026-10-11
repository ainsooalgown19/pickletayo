import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccount } from "@/modules/identity/application/current-authorization";
import { FacilityService } from "@/modules/facilities/application/facility-service";
import { rateRuleSchema } from "@/modules/facilities/api/schemas";
export async function POST(request: Request, { params }: { params: Promise<{ courtId: string }> }) { try { const { courtId } = await params; const input = rateRuleSchema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ detail: "Enter a valid pricing rule.", code: "VALIDATION_FAILED" }, { status: 400 }); return NextResponse.json(await new FacilityService().addRateRule(await currentAccount(), courtId, input.data), { status: 201 }); } catch (cause) { return routeError(cause); } }
