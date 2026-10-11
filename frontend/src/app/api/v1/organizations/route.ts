import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccountWithAnyRole } from "@/modules/identity/application/current-authorization";
import { OrganizationService } from "@/modules/organizations/application/organization-service";
import { createOrganizationSchema } from "@/modules/organizations/api/schemas";

export const dynamic = "force-dynamic";
const service = () => new OrganizationService();
function paging(request: Request) { const url = new URL(request.url); return { page: Math.max(0, Number(url.searchParams.get("page")) || 0), size: Math.min(100, Math.max(1, Number(url.searchParams.get("size")) || 20)) }; }

export async function GET(request: Request) {
  try { const account = await currentAccountWithAnyRole(["PLATFORM_ADMIN"]); const { page, size } = paging(request); return NextResponse.json(await service().listAll(account, page, size)); }
  catch (cause) { return routeError(cause); }
}

export async function POST(request: Request) {
  try {
    const account = await currentAccountWithAnyRole(["PLATFORM_ADMIN"]);
    const input = createOrganizationSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ detail: "Enter valid organization details.", code: "VALIDATION_FAILED", errors: input.error.flatten() }, { status: 400 });
    return NextResponse.json(await service().create(account, input.data), { status: 201 });
  } catch (cause) { return routeError(cause); }
}
