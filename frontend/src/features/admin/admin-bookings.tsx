"use client";

import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import type { AdminBooking, Page } from "@/lib/api/contracts";
import { money } from "@/lib/api/contracts";

const statuses = ["", "HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"];
const cancellable = new Set(["HOLD", "PENDING_PAYMENT", "CONFIRMED"]);

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase());
}

export function AdminBookings() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const bookings = useQuery({
    queryKey: ["admin-bookings", query, status],
    queryFn: () => auth.request<Page<AdminBooking>>(`/admin/bookings?size=100&query=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`),
    enabled: Boolean(auth.account),
  });

  function search(event: FormEvent) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  async function transition(booking: AdminBooking, action: "cancel" | "check-in") {
    const promptText = action === "cancel" ? "Why is this booking being cancelled?" : "Optional check-in note:";
    const reason = window.prompt(promptText, action === "cancel" ? "Cancelled by facility operator" : "Player arrived at the facility");
    if (reason === null) return;
    setBusy(booking.bookingId);
    setError("");
    setMessage("");
    try {
      await auth.request(`/admin/bookings/${booking.bookingId}/${action}`, { method: "POST", body: JSON.stringify({ reason }) });
      setMessage(action === "cancel" ? `${booking.reference} was cancelled.` : `${booking.reference} was checked in.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The booking could not be updated.");
    } finally {
      setBusy("");
    }
  }

  return <section className="admin-page">
    <header><span className="kicker">LIVE OPERATIONS</span><h1>Booking desk</h1><p>Find reservations for the facilities you manage, cancel active bookings, and check in confirmed players.</p></header>
    <form className="admin-booking-filters" onSubmit={search}>
      <label><span>Search</span><div><Search aria-hidden="true"/><input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Reference, player, facility, or court"/></div></label>
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((option) => <option key={option || "all"} value={option}>{option ? label(option) : "All statuses"}</option>)}</select></label>
      <button className="primary" type="submit">Apply filters</button>
    </form>
    {message && <div className="form-notice" role="status">{message}</div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="admin-booking-summary"><strong>{bookings.data?.totalElements ?? 0}</strong><span> matching bookings</span></div>
    <div className="admin-list admin-booking-list">
      {bookings.isLoading ? <p>Loading bookings…</p> : bookings.isError ? <div className="form-error" role="alert">Bookings could not be loaded.</div> : bookings.data?.content.length ? bookings.data.content.map((booking) => <article key={booking.bookingId}>
        <CalendarDays aria-hidden="true"/>
        <div className="admin-booking-info">
          <div className="admin-booking-heading"><h2>{booking.reference}</h2><span className={`booking-status booking-status-${booking.status.toLowerCase()}`}>{label(booking.status)}</span></div>
          <p><strong>{booking.playerName}</strong> · {booking.facilityName} / {booking.courtName}</p>
          <p>{dateTime(booking.startsAt)} – {dateTime(booking.endsAt)} · {money(booking.totalAmount, booking.currencyCode)}</p>
          <small>Payment: {label(booking.paymentStatus)}</small>
          <div className="admin-booking-actions">
            {booking.status === "CONFIRMED" && <button disabled={busy === booking.bookingId} onClick={() => void transition(booking, "check-in")}>Check in</button>}
            {cancellable.has(booking.status) && <button className="danger" disabled={busy === booking.bookingId} onClick={() => void transition(booking, "cancel")}>Cancel booking</button>}
          </div>
        </div>
      </article>) : <div className="empty"><h2>No bookings found</h2><p>New player reservations will appear here automatically.</p></div>}
    </div>
  </section>;
}
