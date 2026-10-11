import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccount } from "@/modules/identity/application/current-authorization";
import { FacilityService } from "@/modules/facilities/application/facility-service";
import { availabilityBlockSchema } from "@/modules/facilities/api/schemas";
export async function POST(request: Request, { params }: { params: Promise<{ courtId: string }> }) { try { const { courtId } = await params; const input = availabilityBlockSchema.safeParse(await request.json().catch(() => null)); if (!input.success) return NextResponse.json({ detail: input.error.issues[0]?.message ?? "Enter a valid availability block.", code: "VALIDATION_FAILED" }, { status: 400 }); return NextResponse.json(await new FacilityService().addAvailabilityBlock(await currentAccount(), courtId, input.data), { status: 201 }); } catch (cause) { return routeError(cause); } }
