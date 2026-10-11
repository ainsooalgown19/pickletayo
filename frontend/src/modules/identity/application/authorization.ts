import type { Account } from "../domain/account";

export class AuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: "AUTHENTICATION_REQUIRED" | "INSUFFICIENT_PERMISSION",
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requireAuthenticatedAccount(account: Account | null): Account {
  if (!account) {
    throw new AuthorizationError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
  }
  return account;
}

export function requireAnyRole(account: Account | null, allowedRoles: readonly string[]): Account {
  const authenticated = requireAuthenticatedAccount(account);
  if (!authenticated.roles.some((role) => allowedRoles.includes(role))) {
    throw new AuthorizationError(403, "INSUFFICIENT_PERMISSION", "You do not have permission to perform this action.");
  }
  return authenticated;
}
