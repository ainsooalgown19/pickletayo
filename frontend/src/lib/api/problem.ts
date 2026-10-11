import { NextResponse } from "next/server";

export function problem(status: number, detail: string, code: string) {
  return NextResponse.json(
    { type: "about:blank", title: code, status, detail, code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
