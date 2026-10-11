import type { Account } from "../domain/account";
import type { AccountSession } from "../domain/session";
import { SupabaseIdentityRepository } from "../infrastructure/supabase-identity-repository";

export class IdentityService {
  constructor(private readonly repository: SupabaseIdentityRepository) {}

  getCurrentAccount(): Promise<Account | null> {
    return this.repository.currentAccount();
  }

  updateCurrentAccount(givenName: string, familyName: string): Promise<Account> {
    return this.repository.updateNames(givenName.trim(), familyName.trim());
  }

  async listCurrentSessions(userAgent?: string): Promise<AccountSession[]> {
    const session = await this.repository.currentSession(userAgent);
    return session ? [session] : [];
  }

  signOutEverywhere(): Promise<void> {
    return this.repository.signOutEverywhere();
  }
}
