import { NextResponse } from "next/server";
import { problem } from "@/lib/api/problem";
import { createIdentityService } from "@/modules/identity/application/create-identity-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await createIdentityService();
  const account = await identity.getCurrentAccount();
  if (!account) return problem(401, "Please sign in to continue.", "AUTHENTICATION_REQUIRED");

  const sessions = await identity.listCurrentSessions(request.headers.get("user-agent") ?? undefined);
  return NextResponse.json(sessions, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  const identity = await createIdentityService();
  const account = await identity.getCurrentAccount();
  if (!account) return problem(401, "Please sign in to continue.", "AUTHENTICATION_REQUIRED");

  await identity.signOutEverywhere();
  return new NextResponse(null, { status: 204 });
}
