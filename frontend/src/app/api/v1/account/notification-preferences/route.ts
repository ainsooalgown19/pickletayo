import { NextResponse } from "next/server";
import { routeError } from "@/lib/api/route-errors";
import { currentAccount } from "@/modules/identity/application/current-authorization";
import { notificationPreferencesSchema } from "@/modules/notifications/api/schemas";
import { NotificationService } from "@/modules/notifications/application/notification-service";

export async function GET() {
  try {
    return NextResponse.json(await new NotificationService().preferences(await currentAccount()), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return routeError(cause);
  }
}

export async function PUT(request: Request) {
  try {
    const input = notificationPreferencesSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ detail: "Choose valid notification preferences.", code: "VALIDATION_FAILED" }, { status: 400 });
    return NextResponse.json(await new NotificationService().updatePreferences(await currentAccount(), input.data));
  } catch (cause) {
    return routeError(cause);
  }
}
