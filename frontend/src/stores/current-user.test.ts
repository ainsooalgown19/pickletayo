import { beforeEach, describe, expect, it } from "vitest";
import type { Account } from "@/modules/identity/domain/account";
import { currentUserDetails, useCurrentUser } from "./current-user";

const account: Account = {
  userId: "93d715d3-d787-4a20-9301-b88be0d25770",
  email: "owner@example.com",
  emailVerified: true,
  givenName: "Court",
  familyName: "Owner",
  status: "ACTIVE",
  roles: ["COURT_OWNER"],
  createdAt: "2026-10-01T00:00:00.000Z",
};

describe("current user cache", () => {
  beforeEach(() => {
    localStorage.clear();
    useCurrentUser.setState({ account: null });
  });

  it("persists reusable account details without credentials", () => {
    useCurrentUser.getState().setAccount(account);

    expect(currentUserDetails()).toEqual(account);
    const stored = localStorage.getItem("pickletayo-current-user") ?? "";
    expect(stored).toContain(account.userId);
    expect(stored).not.toContain("password");
    expect(stored).not.toContain("access_token");
  });

  it("removes cached details on sign-out", () => {
    useCurrentUser.getState().setAccount(account);
    useCurrentUser.getState().clearAccount();

    expect(currentUserDetails()).toBeNull();
    expect(JSON.parse(localStorage.getItem("pickletayo-current-user") ?? "{}").state.account).toBeNull();
  });
});
