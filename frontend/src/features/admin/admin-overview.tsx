"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Building2, CalendarDays, MapPinned, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import type { Organization, Page } from "@/lib/api/contracts";

export function AdminOverview() {
  const auth = useAuth();
  const organizations = useQuery({ queryKey: ["admin-overview-organizations"], queryFn: () => auth.request<Page<Organization>>("/organizations?size=100"), enabled: auth.account?.roles.includes("PLATFORM_ADMIN") });
  return <section className="admin-page"><header><span className="kicker">CONTROL CENTER</span><h1>Platform overview</h1><p>Manage organizations, court inventory, and bookings published to PickleTayo.</p></header><div className="admin-stat-grid"><article><span className="admin-stat-icon"><ShieldCheck/></span><div><strong>{organizations.data?.totalElements ?? "—"}</strong><span>Organizations</span></div></article><article><span className="admin-stat-icon blue"><MapPinned/></span><div><strong>Live</strong><span>Platform operations</span></div></article><article><span className="admin-stat-icon violet"><Building2/></span><div><strong>Ready</strong><span>Facility workflow</span></div></article><article><span className="admin-stat-icon amber"><CalendarDays/></span><div><strong>Ready</strong><span>Booking operations</span></div></article></div><div className="admin-section-heading"><div><span className="kicker">QUICK ACCESS</span><h2>Manage your platform</h2></div></div><div className="admin-quick-grid"><Link href="/admin/organizations"><span className="admin-quick-icon"><Building2/></span><div><h2>Organizations</h2><p>Create operators and assign an owner account.</p></div><ArrowUpRight/></Link><Link href="/admin/facilities"><span className="admin-quick-icon"><MapPinned/></span><div><h2>Facility operations</h2><p>Manage courts, hours, pricing, and closures.</p></div><ArrowUpRight/></Link><Link href="/admin/bookings"><span className="admin-quick-icon"><CalendarDays/></span><div><h2>Booking desk</h2><p>Search reservations, check in players, and manage cancellations.</p></div><ArrowUpRight/></Link></div></section>;
}
