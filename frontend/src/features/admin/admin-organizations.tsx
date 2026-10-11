"use client";

import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import type { Organization, Page } from "@/lib/api/contracts";

function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
export function AdminOrganizations() {
  const auth = useAuth(); const queryClient = useQueryClient(); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const organizations = useQuery({ queryKey: ["admin-organizations"], queryFn: () => auth.request<Page<Organization>>("/organizations?size=100"), enabled: Boolean(auth.account) });
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError(""); setMessage(""); try { await auth.request("/organizations", { method: "POST", body: JSON.stringify({ type: value(data,"type"), legalName: value(data,"legalName"), displayName: value(data,"displayName") }) }); form.reset(); setMessage("Organization created."); await queryClient.invalidateQueries({ queryKey: ["admin-organizations"] }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Organization could not be created."); } finally { setBusy(false); } }
  return <section className="admin-page"><header><span className="kicker">PLATFORM ADMIN</span><h1>Organizations</h1><p>Create and review clubs and court operators.</p></header>{message && <div className="form-notice" role="status">{message}</div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="admin-two-column"><form className="operator-card operator-form" onSubmit={create}><h2><Plus/> New organization</h2><label>Type<select name="type"><option value="COURT_OPERATOR">Court operator</option><option value="CLUB">Club</option></select></label><label>Legal name<input name="legalName" required/></label><label>Display name<input name="displayName" required/></label><label>Owner<input value={auth.account ? `${auth.account.givenName} ${auth.account.familyName} (${auth.account.email})`.trim() : "Current signed-in user"} disabled/></label><button className="primary" disabled={busy}>{busy ? "Creating…" : "Create organization"}</button></form><div className="admin-list">{organizations.isLoading ? <p>Loading organizations…</p> : organizations.data?.content.length ? organizations.data.content.map((organization) => <article key={organization.organizationId}><Building2/><div><h2>{organization.displayName}</h2><p>{organization.legalName}</p><small>{organization.type.replace("_", " ")} · {organization.status}</small></div></article>) : <div className="empty"><h2>No organizations yet</h2><p>Create the first court operator to begin.</p></div>}</div></div></section>;
}
