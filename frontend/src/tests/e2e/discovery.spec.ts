import { expect, test } from "@playwright/test";

test("player can discover live inventory and begin booking", async ({ page }) => {
  await page.route("**/api/v1/facilities**", async (route) => {
    const url = route.request().url();
    if (url.includes("/availability")) {
      await route.fulfill({ json: { facilityId: "facility-1", date: "2026-09-29", timezone: "Asia/Manila", durationMinutes: 60, slots: [{ courtId: "court-1", courtName: "Court 1", startsAt: "2026-09-29T01:00:00Z", endsAt: "2026-09-29T02:00:00Z", price: 600, currencyCode: "PHP" }] } });
    } else if (/\/facilities\/facility-1$/.test(url)) {
      await route.fulfill({ json: { facilityId: "facility-1", organizationId: "org-1", name: "Quezon City Pickle Club", branchCode: "QC", status: "ACTIVE", timezone: "Asia/Manila", location: { addressLine1: "1 Court Road", city: "Quezon City", province: "Metro Manila", countryCode: "PH", latitude: 14.67, longitude: 121.04, verified: true }, courts: [], createdAt: "2026-09-01T00:00:00Z" } });
    } else {
      await route.fulfill({ json: { content: [{ facilityId: "facility-1", name: "Quezon City Pickle Club", status: "ACTIVE", city: "Quezon City", province: "Metro Manila", latitude: 14.67, longitude: 121.04, activeCourts: 2, startingHourlyRate: 600, currencyCode: "PHP" }], totalElements: 1, totalPages: 1, number: 0, size: 24 } });
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /play more/i })).toBeVisible();
  await page.getByRole("button", { name: /view quezon city/i }).first().click();
  await page.getByRole("button", { name: /9:00 AM.*Court 1/i }).click();
  await page.getByRole("button", { name: "Continue to booking" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByText(/sign in or create your player account to continue/i)).toBeVisible();
});

test("platform administrator can open facility operations", async ({ page }) => {
  let bookingCheckedIn = false;
  const adminUser = {
    id: "11111111-1111-1111-1111-111111111111",
    aud: "authenticated",
    role: "authenticated",
    email: "admin@pickletayo.test",
    email_confirmed_at: "2026-09-01T00:00:00Z",
    phone: "",
    confirmed_at: "2026-09-01T00:00:00Z",
    last_sign_in_at: "2026-10-01T00:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { given_name: "System", family_name: "Admin" },
    identities: [],
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    is_anonymous: false,
  };
  await page.route("**/auth/v1/token**", async (route) => route.fulfill({
    json: {
      access_token: "access-test",
      refresh_token: "refresh-test",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: adminUser,
    },
  }));
  await page.route("**/api/v1/**", async (route) => {
    const url=route.request().url();
    if(url.endsWith("/account/me")) return route.fulfill({json:{userId:"11111111-1111-1111-1111-111111111111",email:"admin@pickletayo.test",emailVerified:true,givenName:"System",familyName:"Admin",status:"ACTIVE",roles:["PLATFORM_ADMIN"],createdAt:"2026-09-01T00:00:00Z"}});
    if(url.includes("/admin/bookings")) {
      const booking = {bookingId:"22222222-2222-2222-2222-222222222222",reference:"PT-20261003-BOOKING1",facilityId:"facility-1",facilityName:"Quezon City Pickle Club",courtId:"court-1",courtName:"Court 1",playerId:"33333333-3333-3333-3333-333333333333",playerName:"Juan Player",startsAt:"2026-10-03T09:00:00Z",endsAt:"2026-10-03T10:00:00Z",status:bookingCheckedIn?"CHECKED_IN":"CONFIRMED",subtotalAmount:600,discountAmount:0,totalAmount:600,currencyCode:"PHP",paymentStatus:"PAID",createdAt:"2026-10-02T00:00:00Z",updatedAt:"2026-10-02T00:00:00Z"};
      if(route.request().method()==="POST") { bookingCheckedIn = true; return route.fulfill({json:{...booking,status:"CHECKED_IN"}}); }
      return route.fulfill({json:{content:[booking],totalElements:1,totalPages:1,number:0,size:100}});
    }
    if(url.includes("/organizations/org-1/facilities")) return route.fulfill({json:{content:[],totalElements:0,totalPages:0,number:0,size:50}});
    if(url.includes("/organizations")) return route.fulfill({json:{content:[{organizationId:"org-1",type:"COURT_OPERATOR",legalName:"Pickle Operations Inc.",displayName:"Pickle Operations",status:"ACTIVE",ownerUserId:"11111111-1111-1111-1111-111111111111",createdAt:"2026-09-01T00:00:00Z"}],totalElements:1,totalPages:1,number:0,size:50}});
    if(url.includes("/facilities")) return route.fulfill({json:{content:[],totalElements:0,totalPages:0,number:0,size:9}});
    return route.fulfill({status:404,json:{detail:"Not mocked"}});
  });
  await page.goto("/");
  await page.locator(
    'button[aria-label="Sign in or create an account"]:visible, nav[aria-label="Mobile navigation"] button:has-text("Profile"):visible',
  ).click();
  await page.getByLabel("Email address").fill("admin@pickletayo.test");
  await page.getByLabel("Password", { exact: true }).fill("AdminPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pickletayo-current-user"))).toContain("PLATFORM_ADMIN");
  const cachedUser = await page.evaluate(() => localStorage.getItem("pickletayo-current-user") ?? "");
  expect(cachedUser).toContain("admin@pickletayo.test");
  expect(cachedUser).not.toContain("AdminPassword123!");
  expect(cachedUser).not.toContain("access-test");
  await page.getByRole("button", { name: "Manage", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("link", { name: "Facilities", exact: true }).click();
  await expect(page.getByRole("heading",{name:"Facility operations"})).toBeVisible();
  await expect(page.getByLabel("Organization",{exact:true})).toHaveValue("org-1");
  await expect(page.getByText("Add facility",{exact:true})).toBeVisible();
  await page.getByText("Create an organization", { exact: true }).click();
  await expect(page.getByLabel("Owner", { exact: true })).toHaveValue("System Admin (admin@pickletayo.test)");
  await page.getByRole("link", { name: "Bookings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Booking desk" })).toBeVisible();
  await expect(page.getByText("PT-20261003-BOOKING1")).toBeVisible();
  await expect(page.getByText(/Juan Player.*Quezon City Pickle Club/)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("Checked in by test operator"));
  await page.getByRole("button", { name: "Check in" }).click();
  await expect(page.getByRole("article").getByText("Checked in", { exact: true })).toBeVisible();
});
