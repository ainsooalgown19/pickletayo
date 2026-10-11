import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountFromUser, type Account } from "../domain/account";
import type { AccountSession } from "../domain/session";

export class SupabaseIdentityRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async currentAccount(): Promise<Account | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) return null;
    const fallback = accountFromUser(data.user);
    const [{ data: profile }, { data: assignedRoles }] = await Promise.all([
      this.supabase.from("profiles").select("given_name,family_name,status,created_at").eq("user_id", data.user.id).maybeSingle(),
      this.supabase.from("user_roles").select("role_code").eq("user_id", data.user.id),
    ]);

    return {
      ...fallback,
      givenName: profile?.given_name ?? fallback.givenName,
      familyName: profile?.family_name ?? fallback.familyName,
      status: profile?.status === "ACTIVE" ? "ACTIVE" : fallback.status,
      roles: assignedRoles?.length ? assignedRoles.map(({ role_code }) => role_code) : fallback.roles,
      createdAt: profile?.created_at ?? fallback.createdAt,
    };
  }

  async updateNames(givenName: string, familyName: string): Promise<Account> {
    const { data, error } = await this.supabase.auth.updateUser({
      data: { given_name: givenName, family_name: familyName },
    });
    if (error || !data.user) throw new Error(error?.message ?? "Profile could not be updated.");

    await this.supabase
      .from("profiles")
      .update({ given_name: givenName, family_name: familyName, updated_at: new Date().toISOString() })
      .eq("user_id", data.user.id);

    return accountFromUser(data.user);
  }

  async currentSession(userAgent?: string): Promise<AccountSession | null> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) return null;

    const { data } = await this.supabase.auth.getSession();
    const session = data.session;
    if (!session) return null;

    return {
      sessionId: createHash("sha256").update(session.access_token).digest("hex").slice(0, 16),
      createdAt: new Date(session.user.created_at).toISOString(),
      lastUsedAt: new Date().toISOString(),
      expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
      current: true,
      revoked: false,
      userAgent,
    };
  }

  async signOutEverywhere() {
    const { error } = await this.supabase.auth.signOut({ scope: "global" });
    if (error) throw new Error(error.message);
  }
}
