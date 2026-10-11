import type { Metadata } from "next";
import { AdminGate } from "@/features/admin/admin-gate";
import { AdminSidebar } from "@/features/admin/admin-sidebar";

export const metadata: Metadata = { title: "Admin" };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate><div className="admin-shell"><AdminSidebar/><main className="admin-main">{children}</main></div></AdminGate>;
}
