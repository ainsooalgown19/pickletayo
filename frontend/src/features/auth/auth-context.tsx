"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { accountFromUser, type Account } from "@/modules/identity/domain/account";
import { currentUserDetails, useCurrentUser } from "@/stores/current-user";
import { demoAccounts, type DemoRole } from "@/demo/demo-data";
import { demoMode } from "@/demo/demo-api";

export type { Account } from "@/modules/identity/domain/account";

type RegisterInput = {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
};

type AuthContextValue = {
  account: Account | null;
  status: "loading" | "guest" | "authenticated";
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  verifyEmail: (email: string, token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  updateAccount: (givenName: string, familyName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  demoMode: boolean;
  switchDemoRole: (role: DemoRole) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const demoRoleStorageKey = "pickletayo-demo-role";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const supabase = useMemo(() => demoMode ? null : createSupabaseBrowserClient(), []);

  function saveAccount(current: Account) {
    setAccount(current);
    useCurrentUser.getState().setAccount(current);
  }

  function clear() {
    setAccount(null);
    useCurrentUser.getState().clearAccount();
    setStatus("guest");
  }

  async function loadAccount() {
    const current = await apiRequest<Account>("/account/me");
    saveAccount(current);
    setStatus("authenticated");
  }

  async function synchronizeAccount(user: Parameters<typeof accountFromUser>[0]) {
    const fallback = accountFromUser(user);
    const cached = currentUserDetails();
    if (cached?.userId !== fallback.userId) saveAccount(fallback);
    setStatus("loading");
    try {
      await loadAccount();
    } catch {
      saveAccount(fallback);
      setStatus("authenticated");
    }
  }

  useEffect(() => {
    if (demoMode) {
      const selectedRole = window.localStorage.getItem(demoRoleStorageKey) as DemoRole | null;
      if (selectedRole === "GUEST") { clear(); return; }
      const cached = currentUserDetails();
      const roleAccount = selectedRole ? demoAccounts[selectedRole] : null;
      saveAccount(roleAccount ?? (cached && Object.values(demoAccounts).some((item) => item.userId === cached.userId) ? cached : demoAccounts.PLAYER));
      setStatus("authenticated");
      return;
    }
    const cached = currentUserDetails();
    if (cached) setAccount(cached);

    supabase!.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        await synchronizeAccount(data.user);
      } else {
        clear();
      }
    }).catch(clear);

    const { data } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void synchronizeAccount(session.user);
      } else {
        clear();
      }
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    account,
    status,
    async signIn(email, password) {
      if (demoMode) {
        const match = Object.values(demoAccounts).find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? demoAccounts.PLAYER;
        window.localStorage.setItem(demoRoleStorageKey, Object.entries(demoAccounts).find(([, item]) => item.userId === match.userId)?.[0] ?? "PLAYER");
        saveAccount(match); setStatus("authenticated"); return;
      }
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw new ApiError(error.status ?? 400, error.message);
      await loadAccount();
    },
    async register(input) {
      if (!input.termsAccepted || !input.privacyAcknowledged) throw new ApiError(400, "Accept the terms and privacy policy to continue.");
      if (demoMode) { window.localStorage.setItem(demoRoleStorageKey, "PLAYER"); saveAccount({ ...demoAccounts.PLAYER, email: input.email, givenName: input.givenName, familyName: input.familyName }); setStatus("authenticated"); return; }
      const { error } = await supabase!.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            given_name: input.givenName,
            family_name: input.familyName,
            terms_accepted: true,
            privacy_acknowledged: true,
          },
        },
      });
      if (error) throw new ApiError(error.status ?? 400, error.message);
    },
    async verifyEmail(email, token) {
      if (demoMode) return;
      const { error } = await supabase!.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw new ApiError(error.status ?? 400, error.message);
    },
    async resendVerification(email) {
      if (demoMode) return;
      const { error } = await supabase!.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw new ApiError(error.status ?? 400, error.message);
    },
    async forgotPassword(email) {
      if (demoMode) return;
      const next = encodeURIComponent("/?auth=recovery#account");
      const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=${next}` });
      if (error) throw new ApiError(error.status ?? 400, error.message);
    },
    async resetPassword(token, newPassword) {
      if (demoMode) return;
      if (token) {
        const { error: verificationError } = await supabase!.auth.verifyOtp({ token_hash: token, type: "recovery" });
        if (verificationError) throw new ApiError(verificationError.status ?? 400, verificationError.message);
      }
      const { error } = await supabase!.auth.updateUser({ password: newPassword });
      if (error) throw new ApiError(error.status ?? 400, error.message);
    },
    async signOut() {
      if (demoMode) { window.localStorage.setItem(demoRoleStorageKey, "GUEST"); clear(); return; }
      try {
        await supabase!.auth.signOut({ scope: "local" });
      } finally {
        clear();
      }
    },
    async request<T>(path: string, init?: RequestInit) {
      if (!account) throw new ApiError(401, "Please sign in to continue.");
      return apiRequest<T>(path, init);
    },
    async updateAccount(givenName, familyName) {
      if (!account) throw new ApiError(401, "Please sign in to continue.");
      const updated = await apiRequest<Account>("/account/me", { method: "PATCH", body: JSON.stringify({ givenName, familyName }) });
      saveAccount(updated);
    },
    async changePassword(currentPassword, newPassword) {
      if (!account) throw new ApiError(401, "Please sign in to continue.");
      if (demoMode) return;
      const { error: authenticationError } = await supabase!.auth.signInWithPassword({ email: account.email, password: currentPassword });
      if (authenticationError) throw new ApiError(authenticationError.status ?? 400, "The current password is incorrect.");
      const { error } = await supabase!.auth.updateUser({ password: newPassword });
      if (error) throw new ApiError(error.status ?? 400, error.message);
      await supabase!.auth.signOut({ scope: "others" });
    },
    demoMode,
    switchDemoRole(role) {
      window.localStorage.setItem(demoRoleStorageKey, role);
      if (role === "GUEST") { clear(); return; }
      saveAccount(demoAccounts[role]);
      setStatus("authenticated");
    },
  }), [account, status, supabase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
