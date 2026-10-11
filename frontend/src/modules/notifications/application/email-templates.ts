export type BookingEmailKind = "BOOKING_HOLD" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_RECEIPT";

export type BookingEmailData = {
  playerName: string;
  reference: string;
  facilityName: string;
  courtName: string;
  startsAt: Date;
  endsAt: Date;
  totalAmount: number;
  currencyCode: string;
  holdExpiresAt?: Date | null;
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function dateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(value);
}

function money(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: currencyCode }).format(amount);
}

const titles: Record<BookingEmailKind, string> = {
  BOOKING_HOLD: "Your court is being held",
  BOOKING_CONFIRMED: "Your booking is confirmed",
  BOOKING_CANCELLED: "Your booking was cancelled",
  BOOKING_RECEIPT: "Your PickleTayo receipt",
};

export function bookingEmail(kind: BookingEmailKind, data: BookingEmailData) {
  const title = titles[kind];
  const when = `${dateTime(data.startsAt)} – ${dateTime(data.endsAt)}`;
  const amount = money(data.totalAmount, data.currencyCode);
  const holdNote = kind === "BOOKING_HOLD" && data.holdExpiresAt ? ` Complete checkout before ${dateTime(data.holdExpiresAt)}.` : "";
  const plain = `${title}\n\nHi ${data.playerName},\n\nBooking ${data.reference}\n${data.facilityName} · ${data.courtName}\n${when}\nTotal: ${amount}.${holdNote}\n\nPickleTayo`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#17352a;background:#f4f7f5;padding:24px"><main style="max-width:560px;margin:auto;background:white;border-radius:18px;padding:28px"><p style="color:#0a7e45;font-weight:800">PickleTayo</p><h1>${escapeHtml(title)}</h1><p>Hi ${escapeHtml(data.playerName)},</p><p><strong>${escapeHtml(data.reference)}</strong></p><p>${escapeHtml(data.facilityName)} · ${escapeHtml(data.courtName)}<br>${escapeHtml(when)}</p><p><strong>Total: ${escapeHtml(amount)}</strong></p>${holdNote ? `<p>${escapeHtml(holdNote.trim())}</p>` : ""}<p style="color:#607067">See you on court.</p></main></body></html>`;
  return { subject: `${title} · ${data.reference}`, html, text: plain };
}
