export type AnalyticsEvent = "facility_search" | "facility_view" | "booking_started" | "booking_hold_created" | "booking_confirmed";
export function track(event: AnalyticsEvent, properties: Record<string, string | number> = {}) {
  if (process.env.NODE_ENV === "development") console.info("[analytics]", event, properties);
}
