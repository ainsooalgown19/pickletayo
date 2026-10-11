"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.status === "loading") return <div className="admin-loading" role="status" aria-live="polite"><LoaderCircle aria-hidden="true"/><span>Loading your workspace…</span></div>;
  if (!auth.account) return <div className="admin-state"><h1>Sign in required</h1><p>Sign in from the player application before opening the admin console.</p><Link className="primary admin-link-button" href="/?adminLogin=1">Return to PickleTayo</Link></div>;
  if (!auth.account.roles.some((role) => ["PLATFORM_ADMIN", "COURT_OWNER", "STAFF", "CLUB_ADMIN"].includes(role))) return <div className="admin-state"><h1>Access denied</h1><p>Your account does not have facility-management permission.</p><Link href="/">Return home</Link></div>;
  return <>{children}</>;
}
