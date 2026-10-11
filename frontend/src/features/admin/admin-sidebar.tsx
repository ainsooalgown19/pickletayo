"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, LayoutDashboard, MapPinned } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/facilities", label: "Facilities", icon: MapPinned },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return <aside className="admin-sidebar">
    <Link className="admin-brand" href="/" aria-label="PickleTayo home">
      <img src="/brand/pickletayo-mark.svg" alt="" width="32" height="40"/>
      <span><b>Pickle</b>Tayo</span>
    </Link>
    <nav aria-label="Administrator">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return <Link href={href} key={href} aria-current={active ? "page" : undefined}>
          <Icon aria-hidden="true"/><span>{label}</span>
        </Link>;
      })}
    </nav>
    <Link className="admin-back" href="/"><span aria-hidden="true">←</span> Player experience</Link>
  </aside>;
}
