import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { emailDeliveryConfigured } from "@/modules/notifications/infrastructure/email-environment";
import { NotificationService } from "@/modules/notifications/application/notification-service";

function authorized(request: Request) {
  const expected = process.env.NOTIFICATION_WORKER_SECRET;
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !actual || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) return NextResponse.json({ detail: "Worker authorization is required.", code: "UNAUTHORIZED" }, { status: 401 });
    if (!emailDeliveryConfigured()) return NextResponse.json({ detail: "Gmail delivery is not configured.", code: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
    return NextResponse.json(await new NotificationService().processPending());
  } catch (cause) {
    return routeError(cause);
  }
}
