import { describe, expect, it } from "vitest";
import type { Account } from "../domain/account";
import { AuthorizationError, requireAnyRole, requireAuthenticatedAccount } from "./authorization";

const account: Account = {
  userId: "11111111-1111-1111-1111-111111111111",
  email: "admin@pickletayo.test",
  emailVerified: true,
  givenName: "System",
  familyName: "Administrator",
  status: "ACTIVE",
  roles: ["PLAYER", "PLATFORM_ADMIN"],
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("identity authorization", () => {
  it("requires an authenticated account", () => {
    expect(requireAuthenticatedAccount(account)).toBe(account);
    expect(() => requireAuthenticatedAccount(null)).toThrowError(AuthorizationError);
  });

  it("accepts any explicitly allowed role", () => {
    expect(requireAnyRole(account, ["PLATFORM_ADMIN"])).toBe(account);
  });

  it("rejects an authenticated account without an allowed role", () => {
    expect(() => requireAnyRole({ ...account, roles: ["PLAYER"] }, ["PLATFORM_ADMIN"]))
      .toThrowError(expect.objectContaining({ status: 403, code: "INSUFFICIENT_PERMISSION" }));
  });
});
