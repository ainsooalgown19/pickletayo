import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
});

test("player can discover a court and complete a demo wallet payment", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /play more/i })).toBeVisible();
  await expect(page.getByLabel("Test as")).toHaveValue("PLAYER");
  await expect(page.locator("button:visible").filter({ hasText: /^Manage$/ })).toHaveCount(0);

  await page.getByRole("button", { name: /view riverside indoor courts/i }).first().click();
  await page.locator(".slots button").first().click();
  await page.getByRole("button", { name: "Continue to booking" }).click();
  await expect(page.getByRole("heading", { name: "Review your booking" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("radio", { name: /GCash demo/i }).click();
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page.getByText("Booking confirmed", { exact: true })).toBeVisible();
  await expect(page.getByText("Paid · Demo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View my bookings" }).click();
  await expect(page.getByText(/PT-\d{6}/).first()).toBeVisible();
  await expect(page.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Paid/).first()).toBeVisible();

  await page.getByRole("button", { name: "Find a court", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find your next game" })).toBeVisible();
  await page.getByLabel("Search courts").fill("Skyline");
  await expect(page.getByRole("button", { name: /view riverside indoor courts/i })).toHaveCount(0);
  await page.getByRole("button", { name: /view skyline rooftop pickleball/i }).click();
  await expect(page.getByRole("heading", { name: "Skyline Rooftop Pickleball" })).toBeVisible();
});

test("platform administrator can manage facilities and check in a booking", async ({ page }) => {
  await page.getByLabel("Test as").selectOption("ADMIN");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pickletayo-current-user"))).toContain("PLATFORM_ADMIN");

  await page.locator("button:visible").filter({ hasText: /^Manage$/ }).first().click();
  await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible();
  await page.getByRole("link", { name: "Facilities", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Facility operations" })).toBeVisible();
  await expect(page.getByLabel("Organization", { exact: true })).toHaveValue("org-rally-point");
  await expect(page.getByText("Add facility", { exact: true })).toBeVisible();
  await page.getByText("Create an organization", { exact: true }).click();
  await expect(page.getByLabel("Owner", { exact: true })).toHaveValue("System Administrator (admin@pickletayo.test)");

  await page.getByRole("link", { name: "Bookings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Booking desk" })).toBeVisible();
  await expect(page.getByText("PT-DEMO-102")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("Checked in during demo test"));
  await page.getByRole("article").filter({ hasText: "PT-DEMO-102" }).getByRole("button", { name: "Check in" }).click();
  await expect(page.getByRole("article").filter({ hasText: "PT-DEMO-102" }).getByText("Checked in", { exact: true })).toBeVisible();
});

test("player can join and create an open play session", async ({ page }) => {
  await page.getByLabel("Test as").selectOption("GUEST");
  await page.getByRole("button", { name: /Explore open play/i }).click();
  await expect(page.getByRole("heading", { name: /Find a game/i })).toBeVisible();

  const marina = page.getByRole("article").filter({ hasText: "Marina Courts" });
  await expect(marina).toBeVisible();
  await marina.getByRole("button", { name: "Sign in" }).click();
  const signInDialog = page.getByRole("dialog", { name: "Sign in to Open Play" });
  await expect(signInDialog.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await signInDialog.getByRole("button", { name: "Close" }).click();

  await page.getByLabel("Test as").selectOption("PLAYER");
  await marina.getByRole("button", { name: "Join" }).click();
  await expect(marina.getByRole("button", { name: "Leave" })).toBeVisible();
  await expect(page.getByText("You joined Marina Courts.")).toBeVisible();

  await page.getByRole("button", { name: "Create session" }).click();
  await page.getByLabel("Venue").selectOption("facility-garden");
  await page.getByLabel("Player capacity").fill("8");
  await page.getByRole("button", { name: "Create public session" }).click();
  await expect(page.getByRole("heading", { name: "Garden City Pickle Courts" })).toBeVisible();
  await expect(page.getByText(/was created and you are on the player list/i)).toBeVisible();

  await page.getByRole("button", { name: "Bookings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upcoming bookings" })).toBeVisible();
  const joinedSessions = page.locator(".open-play-activity");
  await expect(joinedSessions.getByRole("heading", { name: "Sessions you joined" })).toBeVisible();
  await expect(joinedSessions.getByRole("heading", { name: "Garden City Pickle Courts" })).toBeVisible();
});

test("guest can browse events and player can register and host one", async ({ page }) => {
  await page.getByLabel("Test as").selectOption("GUEST");
  if ((page.viewportSize()?.width ?? 1000) <= 800) {
    await page.getByRole("button", { name: "Discover", exact: true }).click();
    await page.getByRole("button", { name: /^Events/ }).click();
  } else {
    await page.getByRole("button", { name: "Events", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: /Events worth/i })).toBeVisible();
  await page.getByRole("button", { name: "Social", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Saturday Social Mixer" }).last()).toBeVisible();
  await page.getByRole("button", { name: "View Saturday Social Mixer" }).click();
  const guestEvent = page.getByRole("dialog", { name: "Saturday Social Mixer" });
  await guestEvent.getByRole("button", { name: "Sign in to register" }).click();
  const signInDialog = page.getByRole("dialog", { name: "Sign in to Events" });
  await expect(signInDialog.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await signInDialog.getByRole("button", { name: "Close" }).click();
  await guestEvent.getByRole("button", { name: "Close" }).click();

  await page.getByLabel("Test as").selectOption("PLAYER");
  await page.getByRole("button", { name: "View Saturday Social Mixer" }).click();
  const playerEvent = page.getByRole("dialog", { name: "Saturday Social Mixer" });
  await playerEvent.getByRole("button", { name: "Register for event" }).click();
  await expect(page.getByText("You registered for Saturday Social Mixer.")).toBeVisible();
  await expect(playerEvent.getByRole("button", { name: "Cancel registration" })).toBeVisible();
  await playerEvent.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Host an event" }).first().click();
  await page.getByLabel("Event name").fill("Friday Night Rally");
  await page.getByLabel("Venue").selectOption("facility-skyline");
  await page.getByLabel("Format").fill("Americano mixer");
  await page.getByLabel("Event details").fill("A friendly Friday night mixer with rotating partners and guaranteed games for everyone.");
  await page.getByRole("button", { name: "Publish public event" }).click();
  await expect(page.getByText(/Friday Night Rally was published/i)).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Friday Night Rally" })).toBeVisible();
  await page.getByRole("dialog", { name: "Friday Night Rally" }).getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Bookings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your event registrations" })).toBeVisible();
  await expect(page.locator(".event-activity").getByRole("heading", { name: "Friday Night Rally" })).toBeVisible();
});

test("guest can browse clubs and player can join and create one", async ({ page }) => {
  await page.getByLabel("Test as").selectOption("GUEST");
  if ((page.viewportSize()?.width ?? 1000) <= 800) {
    await page.getByRole("button", { name: "Discover", exact: true }).click();
    await page.getByRole("button", { name: /^Clubs/ }).click();
  } else {
    await page.getByRole("button", { name: "Clubs", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: /Find your people/i })).toBeVisible();
  await page.getByRole("article").filter({ hasText: "QC Pickle Crew" }).getByRole("button", { name: /View club/i }).click();
  const clubDialog = page.getByRole("dialog", { name: /QC Pickle Crew/i });
  await expect(clubDialog.getByText(/welcoming Quezon City community/i)).toBeVisible();
  await clubDialog.getByRole("button", { name: "Sign in to join" }).click();
  const signInDialog = page.getByRole("dialog", { name: "Sign in to Clubs" });
  await expect(signInDialog.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await signInDialog.getByRole("button", { name: "Close" }).click();
  await clubDialog.getByRole("button", { name: "Close" }).click();

  await page.getByLabel("Test as").selectOption("PLAYER");
  await page.getByRole("button", { name: "Join club", exact: true }).click();
  await expect(page.getByText(/You joined Makati Kitchen/i)).toBeVisible();

  await page.getByRole("button", { name: "Start a club" }).click();
  await page.getByLabel("Club name").fill("Weekend Paddle Crew");
  await page.getByLabel("Home venue").selectOption("facility-skyline");
  await page.getByLabel("Regular schedule").fill("Saturdays at 8:00 AM");
  await page.getByLabel("About the club").fill("Friendly weekend games for beginner and intermediate players.");
  await page.getByRole("button", { name: "Create public club" }).click();
  await expect(page.getByText(/Weekend Paddle Crew was created/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weekend Paddle Crew" }).first()).toBeVisible();
});
