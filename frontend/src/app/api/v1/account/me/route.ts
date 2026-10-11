import { NextResponse } from "next/server";
import { z } from "zod";
import { problem } from "@/lib/api/problem";
import { createIdentityService } from "@/modules/identity/application/create-identity-service";

export const dynamic = "force-dynamic";

const updateAccountSchema = z.object({
  givenName: z.string().trim().min(1).max(80),
  familyName: z.string().trim().min(1).max(80),
});

export async function GET() {
  const identity = await createIdentityService();
  const account = await identity.getCurrentAccount();
  if (!account) return problem(401, "Please sign in to continue.", "AUTHENTICATION_REQUIRED");
  return NextResponse.json(account, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const body = updateAccountSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return problem(400, "Enter a valid first and last name.", "VALIDATION_FAILED");

  const identity = await createIdentityService();
  const account = await identity.getCurrentAccount();
  if (!account) return problem(401, "Please sign in to continue.", "AUTHENTICATION_REQUIRED");

  try {
    const updated = await identity.updateCurrentAccount(body.data.givenName, body.data.familyName);
    return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return problem(400, cause instanceof Error ? cause.message : "Profile could not be updated.", "PROFILE_UPDATE_FAILED");
  }
}
