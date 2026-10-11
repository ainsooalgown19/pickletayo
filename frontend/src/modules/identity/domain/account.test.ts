import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { accountFromUser } from "./account";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    app_metadata: {},
    user_metadata: { given_name: "Pia", family_name: "Player" },
    aud: "authenticated",
    created_at: "2026-09-30T00:00:00.000Z",
    email: "pia@example.com",
    email_confirmed_at: "2026-09-30T00:01:00.000Z",
    ...overrides,
  } as User;
}

describe("accountFromUser", () => {
  it("maps confirmed Supabase users and supplies the player role", () => {
    expect(accountFromUser(user())).toEqual({
      userId: "user-123",
      email: "pia@example.com",
      emailVerified: true,
      givenName: "Pia",
      familyName: "Player",
      status: "ACTIVE",
      roles: ["PLAYER"],
      createdAt: "2026-09-30T00:00:00.000Z",
    });
  });

  it("uses trusted application roles when present", () => {
    const account = accountFromUser(user({ app_metadata: { roles: ["COURT_OWNER", "STAFF"] } }));
    expect(account.roles).toEqual(["COURT_OWNER", "STAFF"]);
  });

  it("marks unconfirmed users as pending verification", () => {
    const account = accountFromUser(user({ email_confirmed_at: undefined }));
    expect(account.emailVerified).toBe(false);
    expect(account.status).toBe("PENDING_VERIFICATION");
  });
});
