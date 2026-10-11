"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarClock, CheckCircle2, CircleDollarSign, ImagePlus, MapPin, Plus, ShieldCheck, Wrench } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { type Court, type FacilityDetail, type FacilitySummary, type Organization, type Page, money } from "@/lib/api/contracts";
import { FacilityLocationPicker } from "./facility-location-picker";

function field(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }

export function OperatorDashboard() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const isPlatformAdmin = auth.account?.roles.includes("PLATFORM_ADMIN") ?? false;
  const [organizationId, setOrganizationId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const organizations = useQuery({ queryKey: ["operator-organizations", auth.account?.userId], queryFn: () => auth.request<Page<Organization>>(isPlatformAdmin ? "/organizations?size=50" : "/organizations/mine?size=50"), enabled: Boolean(auth.account) });
  useEffect(() => { if (!organizationId && organizations.data?.content[0]) setOrganizationId(organizations.data.content[0].organizationId); }, [organizationId, organizations.data]);
  const facilities = useQuery({ queryKey: ["operator-facilities", organizationId], queryFn: () => auth.request<Page<FacilitySummary>>(`/organizations/${organizationId}/facilities?size=50`), enabled: Boolean(organizationId) });
  useEffect(() => { if (facilityId && !facilities.data?.content.some((item) => item.facilityId === facilityId)) setFacilityId(""); }, [facilityId, facilities.data]);
  const detail = useQuery({ queryKey: ["operator-facility", facilityId], queryFn: () => auth.request<FacilityDetail>(`/facilities/${facilityId}`), enabled: Boolean(facilityId) });

  async function execute(action: () => Promise<unknown>, message: string, reset?: HTMLFormElement) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(message); reset?.reset(); await queryClient.invalidateQueries({ queryKey: ["operator-facilities"] }); await queryClient.invalidateQueries({ queryKey: ["operator-facility"] }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The change could not be saved."); }
    finally { setBusy(false); }
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget; const data=new FormData(form);
    await execute(async () => { const created=await auth.request<Organization>("/organizations", { method:"POST", body:JSON.stringify({ type:field(data,"type"), legalName:field(data,"legalName"), displayName:field(data,"displayName") }) }); setOrganizationId(created.organizationId); await queryClient.invalidateQueries({ queryKey:["operator-organizations"] }); }, "Organization created.", form);
  }
  async function createFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget; const data=new FormData(form);
    await execute(async () => { const created=await auth.request<FacilityDetail>(`/organizations/${organizationId}/facilities`, { method:"POST", body:JSON.stringify({ name:field(data,"name"), branchCode:field(data,"branchCode"), description:field(data,"description"), contactNumber:field(data,"contactNumber"), contactEmail:field(data,"contactEmail"), timezone:"Asia/Manila", location:{ addressLine1:field(data,"addressLine1"), addressLine2:"", barangay:field(data,"barangay"), city:field(data,"city"), province:field(data,"province"), postalCode:field(data,"postalCode"), latitude:Number(field(data,"latitude")), longitude:Number(field(data,"longitude")), directionsLandmark:field(data,"landmark") } }) }); setFacilityId(created.facilityId); }, "Facility created.", form);
  }
  async function addCourt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget; const data=new FormData(form);
    await execute(() => auth.request(`/facilities/${facilityId}/courts`, { method:"POST", body:JSON.stringify({ code:field(data,"code"), name:field(data,"name"), type:field(data,"type"), surfaceType:field(data,"surfaceType"), lighting:data.get("lighting") === "on", baseHourlyRate:Number(field(data,"baseHourlyRate")) }) }), "Court added.", form);
  }
  async function setHours(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form=event.currentTarget; const data=new FormData(form); const closed=data.get("closed")==="on"; await execute(() => auth.request(`/facilities/${facilityId}/operating-hours`, { method:"PUT", body:JSON.stringify({ dayOfWeek:Number(field(data,"dayOfWeek")), closed, opensAt:closed?null:field(data,"opensAt"), closesAt:closed?null:field(data,"closesAt") }) }), "Operating hours saved."); }
  async function addRate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form=event.currentTarget; const data=new FormData(form); await execute(() => auth.request(`/courts/${field(data,"courtId")}/rate-rules`, { method:"POST", body:JSON.stringify({ name:field(data,"name"), dayOfWeek:Number(field(data,"dayOfWeek")), startsAt:field(data,"startsAt"), endsAt:field(data,"endsAt"), hourlyRate:Number(field(data,"hourlyRate")), effectiveFrom:null, effectiveUntil:null, priority:Number(field(data,"priority")||0) }) }), "Rate rule added.", form); }
  async function addBlock(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form=event.currentTarget; const data=new FormData(form); await execute(() => auth.request(`/courts/${field(data,"courtId")}/availability-blocks`, { method:"POST", body:JSON.stringify({ type:field(data,"type"), startsAt:new Date(field(data,"startsAt")).toISOString(), endsAt:new Date(field(data,"endsAt")).toISOString(), reason:field(data,"reason") }) }), "Availability block added.", form); }

  if (!auth.account) return null;
  const selectedFacility=facilities.data?.content.find((item)=>item.facilityId===facilityId);
  const courts: Court[]=detail.data?.courts ?? [];
  return <section className="operator-dashboard">
    <div className="mobile-page-head"><span className="kicker">OPERATOR CONSOLE</span><h1>Facility operations</h1><p>Create and publish the inventory players see in PickleTayo.</p></div>
    {notice && <div className="form-notice" role="status"><CheckCircle2 size={17}/>{notice}</div>}{error && <div className="form-error" role="alert">{error}</div>}
    {isPlatformAdmin && <details className="operator-card"><summary><ShieldCheck/>Create an organization</summary><form className="operator-form" onSubmit={createOrganization}><label>Organization type<select name="type"><option value="COURT_OPERATOR">Court operator</option><option value="CLUB">Club</option></select></label><label>Legal name<input name="legalName" required/></label><label>Display name<input name="displayName" required/></label><label>Owner<input value={`${auth.account.givenName} ${auth.account.familyName} (${auth.account.email})`.trim()} disabled/></label><button className="primary" disabled={busy}>Create organization</button></form></details>}
    <div className="operator-selectors"><label htmlFor="operator-organization">Organization</label><select id="operator-organization" value={organizationId} onChange={(event)=>{setOrganizationId(event.target.value);setFacilityId("");}}><option value="">Select organization</option>{organizations.data?.content.map((item)=><option value={item.organizationId} key={item.organizationId}>{item.displayName}</option>)}</select><label htmlFor="operator-facility">Facility</label><select id="operator-facility" value={facilityId} onChange={(event)=>setFacilityId(event.target.value)}><option value="">Select facility</option>{facilities.data?.content.map((item)=><option value={item.facilityId} key={item.facilityId}>{item.name} · {item.status}</option>)}</select></div>
    {!organizationId ? <div className="empty api-state"><Building2/><h3>No operator organization</h3><p>Create or join an organization before managing facilities.</p></div> : <div className="operator-grid">
      <details className="operator-card" open={!facilityId}><summary><Building2/>Add facility</summary><form className="operator-form" onSubmit={createFacility}><div className="form-row"><label>Name<input name="name" required/></label><label>Branch code<input name="branchCode" required pattern="[A-Za-z0-9_-]{2,40}"/></label></div><label>Description<textarea name="description"/></label><div className="form-row"><label>Contact number<input name="contactNumber"/></label><label>Contact email<input name="contactEmail" type="email"/></label></div><FacilityLocationPicker/><button className="primary" disabled={busy}><Plus/>Create facility</button></form></details>
      {facilityId && <><section className="operator-card facility-overview"><header><MapPin/><div><h2>{selectedFacility?.name}</h2><p>{selectedFacility?.status} · {selectedFacility?.activeCourts} active courts · from {money(selectedFacility?.startingHourlyRate ?? 0,selectedFacility?.currencyCode)}</p></div></header><label>Status<select value={selectedFacility?.status ?? "DRAFT"} disabled={busy} onChange={(event)=>execute(()=>auth.request(`/facilities/${facilityId}/status`,{method:"PATCH",body:JSON.stringify({status:event.target.value})}),"Facility status updated.")}><option>DRAFT</option><option>ACTIVE</option><option>TEMPORARILY_CLOSED</option><option>CLOSED</option></select></label><button disabled title="Supabase Storage integration is required"><ImagePlus/>Upload facility images</button></section>
      <details className="operator-card"><summary><Plus/>Add court</summary><form className="operator-form" onSubmit={addCourt}><div className="form-row"><label>Code<input name="code" required/></label><label>Name<input name="name" required/></label></div><div className="form-row"><label>Type<select name="type"><option>INDOOR</option><option>OUTDOOR</option><option>COVERED</option></select></label><label>Surface<input name="surfaceType" required/></label></div><label>Base hourly price<input name="baseHourlyRate" type="number" min="0" step="0.01" required/></label><label className="check-field"><input name="lighting" type="checkbox"/>Court has lighting</label><button className="primary" disabled={busy}>Add court</button></form></details>
      <details className="operator-card"><summary><CalendarClock/>Operating hours</summary><form className="operator-form" onSubmit={setHours}><label>Day<select name="dayOfWeek">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day,index)=><option value={index+1} key={day}>{day}</option>)}</select></label><div className="form-row"><label>Opens<input name="opensAt" type="time" defaultValue="08:00"/></label><label>Closes<input name="closesAt" type="time" defaultValue="22:00"/></label></div><label className="check-field"><input name="closed" type="checkbox"/>Closed all day</label><button className="primary" disabled={busy}>Save day</button></form></details>
      <details className="operator-card"><summary><CircleDollarSign/>Pricing rule</summary><form className="operator-form" onSubmit={addRate}><CourtSelect courts={courts}/><label>Rule name<input name="name" required placeholder="Weekday peak"/></label><label>Day<select name="dayOfWeek">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day,index)=><option value={index+1} key={day}>{day}</option>)}</select></label><div className="form-row"><label>Starts<input name="startsAt" type="time" required/></label><label>Ends<input name="endsAt" type="time" required/></label></div><div className="form-row"><label>Hourly price<input name="hourlyRate" type="number" min="0" step="0.01" required/></label><label>Priority<input name="priority" type="number" defaultValue="0"/></label></div><button className="primary" disabled={busy||!courts.length}>Add price</button></form></details>
      <details className="operator-card"><summary><Wrench/>Closure or maintenance</summary><form className="operator-form" onSubmit={addBlock}><CourtSelect courts={courts}/><label>Type<select name="type"><option>MAINTENANCE</option><option>OWNER_BLOCK</option><option>TOURNAMENT</option><option>CLOSURE</option></select></label><div className="form-row"><label>Starts<input name="startsAt" type="datetime-local" required/></label><label>Ends<input name="endsAt" type="datetime-local" required/></label></div><label>Reason<input name="reason"/></label><button className="primary" disabled={busy||!courts.length}>Block availability</button></form></details></>}
    </div>}
  </section>;
}

function CourtSelect({courts}:{courts:Court[]}) { return <label>Court<select name="courtId" required><option value="">Select court</option>{courts.map((court)=><option value={court.courtId} key={court.courtId}>{court.name}</option>)}</select></label>; }
