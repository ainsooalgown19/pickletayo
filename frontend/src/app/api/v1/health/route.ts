import { NextResponse } from "next/server";
import { getSupabasePublicEnvironment } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export function GET() {
  getSupabasePublicEnvironment();
  return NextResponse.json(
    {
      status: "ok",
      application: "pickletayo",
      architecture: "nextjs-typescript-modular-monolith",
      supabase: "configured",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
