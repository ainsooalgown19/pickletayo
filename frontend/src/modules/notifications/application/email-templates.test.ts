import { describe, expect, it } from "vitest";
import { bookingEmail } from "./email-templates";

describe("bookingEmail", () => {
  it("renders booking details and escapes player content", () => {
    const result = bookingEmail("BOOKING_HOLD", { playerName: "Pia <Player>", reference: "PT-123", facilityName: "City Club", courtName: "Court 1", startsAt: new Date("2026-10-04T01:00:00Z"), endsAt: new Date("2026-10-04T02:00:00Z"), totalAmount: 600, currencyCode: "PHP", holdExpiresAt: new Date("2026-10-03T01:10:00Z") });
    expect(result.subject).toContain("PT-123");
    expect(result.text).toContain("City Club");
    expect(result.html).toContain("Pia &lt;Player&gt;");
    expect(result.html).not.toContain("Pia <Player>");
  });
});
