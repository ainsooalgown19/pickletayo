import "server-only";

import { createIdentityService } from "./create-identity-service";
import { requireAnyRole, requireAuthenticatedAccount } from "./authorization";

export async function currentAccount() {
  const identity = await createIdentityService();
  return requireAuthenticatedAccount(await identity.getCurrentAccount());
}

export async function currentAccountWithAnyRole(roles: readonly string[]) {
  const identity = await createIdentityService();
  return requireAnyRole(await identity.getCurrentAccount(), roles);
}
