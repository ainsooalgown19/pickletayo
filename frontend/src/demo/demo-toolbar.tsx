"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { resetDemoData } from "./demo-api";
import { demoAccounts, type DemoRole } from "./demo-data";

export function DemoToolbar() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  if (!auth.demoMode) return null;
  const role = (auth.account ? Object.entries(demoAccounts).find(([, account]) => account.userId === auth.account?.userId)?.[0] ?? "PLAYER" : "GUEST") as DemoRole;

  return <aside className={`demo-toolbar ${pathname.startsWith("/admin") ? "demo-toolbar-admin" : ""}`} aria-label="Demo controls">
    <span><b>Demo mode</b><small>Temporary data</small></span>
    <label>Test as
      <select value={role} onChange={(event) => { auth.switchDemoRole(event.target.value as DemoRole); queryClient.clear(); }}>
        <option value="GUEST">Guest (logged out)</option>
        <option value="PLAYER">Player</option>
        <option value="OPERATOR">Facility operator</option>
        <option value="ADMIN">Platform admin</option>
      </select>
    </label>
    <button type="button" onClick={() => { resetDemoData(); queryClient.clear(); window.location.reload(); }} title="Restore the original temporary data"><RotateCcw/> Reset data</button>
  </aside>;
}
