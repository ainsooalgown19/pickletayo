"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, KeyRound, Laptop, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

type Session = { sessionId: string; createdAt: string; lastUsedAt: string; expiresAt: string; current: boolean; revoked: boolean; userAgent?: string };
type NotificationPreferences = { bookingUpdates: boolean; accountSecurity: boolean; productNews: boolean };

export function AccountSettings() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [names, setNames] = useState({ givenName: auth.account?.givenName ?? "", familyName: auth.account?.familyName ?? "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notificationValues, setNotificationValues] = useState<NotificationPreferences>({ bookingUpdates: true, accountSecurity: true, productNews: false });
  const sessions = useQuery({ queryKey: ["account-sessions"], queryFn: () => auth.request<Session[]>("/account/sessions"), enabled: Boolean(auth.account) });
  const notifications = useQuery({ queryKey: ["notification-preferences"], queryFn: () => auth.request<NotificationPreferences>("/account/notification-preferences"), enabled: Boolean(auth.account) });
  const revoke = useMutation({ mutationFn: (sessionId: string) => auth.request<void>(`/account/sessions/${sessionId}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account-sessions"] }) });

  useEffect(() => { if (notifications.data) setNotificationValues(notifications.data); }, [notifications.data]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    try { await auth.updateAccount(names.givenName, names.familyName); setNotice("Profile updated."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Profile could not be updated."); }
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    if (passwords.newPassword !== passwords.confirmPassword) { setError("New passwords do not match."); return; }
    try { await auth.changePassword(passwords.currentPassword, passwords.newPassword); setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); setNotice("Password changed. Other sessions were signed out."); await sessions.refetch(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Password could not be changed."); }
  }
  async function saveNotifications(event: FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    try { const updated = await auth.request<NotificationPreferences>("/account/notification-preferences", { method: "PUT", body: JSON.stringify(notificationValues) }); setNotificationValues(updated); setNotice("Notification preferences saved."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Notification preferences could not be saved."); }
  }

  if (!auth.account) return null;
  return <div className="account-settings">
    {notice && <div className="form-notice" role="status"><CheckCircle2 size={17} />{notice}</div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <section className="settings-card"><header><UserRound /><div><h2>Personal information</h2><p>Keep your player name current.</p></div></header><form className="auth-form" onSubmit={saveProfile}><div className="form-row"><label>First name<input required value={names.givenName} onChange={(event) => setNames({ ...names, givenName: event.target.value })} /></label><label>Last name<input required value={names.familyName} onChange={(event) => setNames({ ...names, familyName: event.target.value })} /></label></div><label>Email address<input value={auth.account.email} disabled /></label><button className="primary">Save profile</button></form></section>
    <section className="settings-card"><header><KeyRound /><div><h2>Change password</h2><p>Changing it signs out your other devices.</p></div></header><form className="auth-form" onSubmit={changePassword}><label>Current password<input required type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /></label><div className="form-row"><label>New password<input required minLength={12} type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /></label><label>Confirm password<input required minLength={12} type="password" autoComplete="new-password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} /></label></div><button className="primary">Change password</button></form></section>
    <section className="settings-card"><header><Laptop /><div><h2>Signed-in devices</h2><p>Revoke sessions you do not recognize.</p></div></header>{sessions.isLoading ? <p>Loading devices…</p> : sessions.data?.map((session) => <div className="session-row" key={session.sessionId}><ShieldCheck /><div><strong>{session.current ? "This device" : session.userAgent || "Signed-in device"}</strong><small>Last used {new Date(session.lastUsedAt).toLocaleString("en-PH")}{session.revoked ? " · Revoked" : ""}</small></div>{!session.current && !session.revoked && <button onClick={() => revoke.mutate(session.sessionId)} aria-label="Revoke session"><X /></button>}</div>)}<button className="danger-button" onClick={async () => { await auth.request<void>("/account/sessions", { method: "DELETE" }); await auth.signOut(); }}>Sign out every device</button></section>
    <section className="settings-card"><header><Bell /><div><h2>Notification preferences</h2><p>Choose which PickleTayo emails you want to receive.</p></div></header>{notifications.isLoading ? <p>Loading preferences…</p> : <form className="auth-form notification-preferences" onSubmit={saveNotifications}><label><input type="checkbox" checked={notificationValues.bookingUpdates} onChange={(event) => setNotificationValues({ ...notificationValues, bookingUpdates: event.target.checked })}/><span><strong>Booking updates</strong><small>Holds, confirmations, cancellations, and receipts.</small></span></label><label><input type="checkbox" checked={notificationValues.accountSecurity} onChange={(event) => setNotificationValues({ ...notificationValues, accountSecurity: event.target.checked })}/><span><strong>Account security</strong><small>Password and important account notices.</small></span></label><label><input type="checkbox" checked={notificationValues.productNews} onChange={(event) => setNotificationValues({ ...notificationValues, productNews: event.target.checked })}/><span><strong>Product news</strong><small>Occasional PickleTayo features and updates.</small></span></label><button className="primary">Save preferences</button></form>}</section>
  </div>;
}
