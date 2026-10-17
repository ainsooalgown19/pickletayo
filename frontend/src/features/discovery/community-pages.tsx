"use client";

import { type FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { AuthPanel } from "@/features/auth/auth-panel";
import { apiRequest } from "@/lib/api/client";
import { money, type Club, type CommunityEvent, type FacilitySummary, type OpenPlaySession, type Page } from "@/lib/api/contracts";

import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  UsersRound,
  X,
  Zap,
} from "lucide-react";

export type CommunityPage = "open-play" | "events" | "clubs" | "manage";

type CommunityPagesProps = {
  page: CommunityPage;
  canManage: boolean;
  onDiscover: () => void;
  onOpenAdmin: () => void;
  facilities: FacilitySummary[];
};

function AvatarStack({ count = 4 }: { count?: number }) {
  const initials = ["AM", "JR", "KC", "LP"];
  return <span className="community-avatars" aria-label={`${count} player profiles`}>{initials.slice(0, count).map((item) => <i key={item}>{item}</i>)}</span>;
}

function OpenPlayPage({ onDiscover, facilities }: Pick<CommunityPagesProps, "onDiscover" | "facilities">) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<"TODAY" | "TOMORROW" | "WEEK">("TODAY");
  const [level, setLevel] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [message, setMessage] = useState("");
  const sessionsQuery = useQuery({ queryKey: ["open-play", range, level], queryFn: () => apiRequest<Page<OpenPlaySession>>(`/open-play?range=${range}&level=${level}`) });
  const sessions = sessionsQuery.data?.content ?? [];
  const featured = sessions[0];
  const joinMutation = useMutation({
    mutationFn: (session: OpenPlaySession) => {
      if (!auth.account) throw new Error("Sign in to join an open play session.");
      return auth.request<OpenPlaySession>(`/open-play/${session.sessionId}/join`, { method: session.joined ? "DELETE" : "POST" });
    },
    onSuccess: (session) => { setMessage(session.joined ? `You joined ${session.venue}.` : `You left ${session.venue}.`); void queryClient.invalidateQueries({ queryKey: ["open-play"] }); },
  });
  const createMutation = useMutation({
    mutationFn: (input: { venue: string; area: string; startsAt: string; level: string; capacity: number }) => auth.request<OpenPlaySession>("/open-play", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (session) => { setCreateOpen(false); setRange("WEEK"); setLevel(""); setMessage(`${session.venue} was created and you are on the player list.`); void queryClient.invalidateQueries({ queryKey: ["open-play"] }); },
  });
  function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const facility = facilities.find((item) => item.facilityId === String(form.get("facilityId")));
    if (!facility) { setMessage("Select an available venue."); return; }
    createMutation.mutate({ venue: facility.name, area: `${facility.city}, ${facility.province}`, startsAt: new Date(String(form.get("startsAt"))).toISOString(), level: String(form.get("level")), capacity: Number(form.get("capacity")) });
  }
  function changeMembership(session: OpenPlaySession) { if (!auth.account) { setAuthOpen(true); return; } joinMutation.mutate(session); }
  function sessionTime(value: string) { return new Intl.DateTimeFormat("en-PH", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }).format(new Date(value)); }
  function levelLabel(value: OpenPlaySession["level"]) { return value === "BEGINNER" ? "Beginner friendly" : value === "INTERMEDIATE" ? "Intermediate" : "All levels"; }
  return <section className="community-page">
    <div className="community-page-hero open-play-hero">
      <div><span className="community-eyebrow"><Zap size={14}/> PUBLIC SESSION BOARD</span><h1>Find a game.<br/><em>Bring your paddle.</em></h1><p>Anyone can browse nearby sessions. Sign in as a player to claim a spot or create a public open play.</p><div className="community-hero-actions"><button className="primary" type="button" onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}>Find a session <ArrowRight size={17}/></button><button className="secondary-action" type="button" onClick={onDiscover}>Browse courts</button></div></div>
      <div className="match-preview"><div className="match-preview-head"><span><i/> Next session</span><b>{featured?.venue ?? "No session selected"}</b></div><div className="mini-court"><span>OPEN PLAY</span><div><i>AM</i><i>JR</i><i>KC</i><i>LP</i></div></div><div className="match-preview-foot"><AvatarStack count={3}/><span><strong>{featured ? `${featured.spotsRemaining} spots left` : "Check another day"}</strong><small>{featured ? sessionTime(featured.startsAt) : "New sessions appear here"}</small></span><button type="button" disabled={!featured || joinMutation.isPending} onClick={() => featured && changeMembership(featured)}>{featured?.joined ? "Leave" : auth.account ? "Join queue" : "Sign in to join"}</button></div></div>
      <div className="community-hero-stats"><span><strong>{sessions.length}</strong> matching sessions</span><span><strong>{sessions.reduce((sum, session) => sum + session.players, 0)}</strong> players listed</span><span><strong>{sessions.reduce((sum, session) => sum + session.spotsRemaining, 0)}</strong> open spots</span></div>
    </div>
    <div className="community-toolbar"><div><button className={range === "TODAY" ? "active" : ""} type="button" onClick={() => setRange("TODAY")}>Today</button><button className={range === "TOMORROW" ? "active" : ""} type="button" onClick={() => setRange("TOMORROW")}>Tomorrow</button><button className={range === "WEEK" ? "active" : ""} type="button" onClick={() => setRange("WEEK")}>This week</button></div><label className="filter-chip"><Target size={15}/><select aria-label="Open play level" value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Any level</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ALL_LEVELS">All levels</option></select></label></div>
    {message && <div className="form-notice open-play-notice" role="status"><CheckCircle2/>{message}</div>}
    {joinMutation.isError && <div className="form-error" role="alert">{joinMutation.error.message}</div>}
    <div className="community-section-heading" ref={listRef}><div><span className="kicker">NEAR YOU</span><h2>Open play sessions</h2></div><span>Temporary demo availability</span></div>
    {sessionsQuery.isLoading ? <div className="empty"><Clock3/><h3>Loading sessions</h3></div> : sessions.length ? <div className="session-list">{sessions.map((session, index) => <article className={`session-card ${session.joined ? "joined" : ""}`} key={session.sessionId}><div className="session-time"><span>{sessionTime(session.startsAt).split(", ").at(-1)}</span><small>{sessionTime(session.startsAt).split(", ")[0]}</small></div><div className={`session-art ${index % 2 ? "blue" : "green"}`}><UsersRound/><span>{session.players}<small>joined</small></span></div><div className="session-details"><span className="level-pill">{levelLabel(session.level)}</span><h3>{session.venue}</h3><p><MapPin size={14}/>{session.area}</p><div><AvatarStack/><small>{session.spotsRemaining} {session.spotsRemaining === 1 ? "spot" : "spots"} left</small></div></div><button className="session-join" type="button" disabled={joinMutation.isPending || (!session.joined && session.spotsRemaining === 0)} onClick={() => changeMembership(session)}>{session.joined ? "Leave" : session.spotsRemaining ? auth.account ? "Join" : "Sign in" : "Full"}<ChevronRight/></button></article>)}</div> : <div className="empty"><UsersRound/><h3>No matching sessions</h3><p>Try another date or level, or create a new open play.</p></div>}
    <div className="community-callout"><span><Sparkles/></span><div><strong>Can’t find the right session?</strong><p>Create a public open play at an active PickleTayo venue.</p></div><button type="button" onClick={() => auth.account ? setCreateOpen(true) : setAuthOpen(true)}><Plus size={17}/> Create session</button></div>
    {createOpen && <div className="overlay"><section className="modal open-play-create" role="dialog" aria-modal="true" aria-labelledby="create-open-play-title"><button className="close" onClick={() => setCreateOpen(false)} aria-label="Close"><X/></button><span className="kicker">NEW PUBLIC OPEN PLAY</span><h2 id="create-open-play-title">Create a player session</h2><p>This session will be publicly visible. Any signed-in player can join while spots remain.</p><form className="operator-form" onSubmit={createSession}><label>Venue<select name="facilityId" required defaultValue=""><option value="" disabled>Select an active venue</option>{facilities.map((facility) => <option value={facility.facilityId} key={facility.facilityId}>{facility.name} · {facility.city}</option>)}</select></label><label>Date and time<input name="startsAt" type="datetime-local" required defaultValue={new Date(Date.now()+86_400_000).toISOString().slice(0,16)}/></label><div className="form-row"><label>Level<select name="level"><option value="ALL_LEVELS">All levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option></select></label><label>Player capacity<input name="capacity" type="number" min="4" max="32" defaultValue="12" required/></label></div>{createMutation.isError && <div className="form-error">{createMutation.error.message}</div>}<button className="primary" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create public session"}</button></form></section></div>}
    {authOpen && <div className="overlay auth-overlay"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Sign in to Open Play"><button className="close" onClick={() => setAuthOpen(false)} aria-label="Close"><X/></button><AuthPanel reason="Sign in or create a player account to join and create public Open Play sessions." onAuthenticated={() => setAuthOpen(false)}/></section></div>}
  </section>;
}

function EventsPage({ facilities }: Pick<CommunityPagesProps, "facilities">) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<"" | CommunityEvent["category"]>("");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<CommunityEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [message, setMessage] = useState("");
  const eventsQuery = useQuery({ queryKey: ["events", category, date], queryFn: () => apiRequest<Page<CommunityEvent>>(`/events?category=${category}&date=${date}`) });
  const events = eventsQuery.data?.content ?? [];
  const featured = events[0];
  const registration = useMutation({
    mutationFn: (event: CommunityEvent) => auth.request<CommunityEvent>(`/events/${event.eventId}/register`, { method: event.registered ? "DELETE" : "POST" }),
    onSuccess: (event) => { setSelected((current) => current?.eventId === event.eventId ? event : current); setMessage(event.registered ? `You registered for ${event.title}.` : `Your registration for ${event.title} was cancelled.`); void queryClient.invalidateQueries({ queryKey: ["events"] }); },
  });
  const createEvent = useMutation({
    mutationFn: (input: Omit<CommunityEvent, "eventId" | "registrations" | "spotsRemaining" | "registered" | "createdAt" | "currencyCode">) => auth.request<CommunityEvent>("/events", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (event) => { setCreateOpen(false); setCategory(""); setDate(""); setSelected(event); setMessage(`${event.title} was published and you are registered.`); void queryClient.invalidateQueries({ queryKey: ["events"] }); },
  });
  function changeRegistration(event: CommunityEvent) { if (!auth.account) { setAuthOpen(true); return; } registration.mutate(event); }
  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const facility = facilities.find((item) => item.facilityId === String(form.get("facilityId")));
    if (!facility) { setMessage("Select an active venue."); return; }
    const startsAt = new Date(String(form.get("startsAt"))); const endsAt = new Date(String(form.get("endsAt")));
    if (endsAt <= startsAt) { setMessage("Event end time must be after its start time."); return; }
    createEvent.mutate({ title: String(form.get("title")), venue: facility.name, area: `${facility.city}, ${facility.province}`, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), category: String(form.get("category")) as CommunityEvent["category"], format: String(form.get("format")), level: String(form.get("level")) as CommunityEvent["level"], description: String(form.get("description")), price: Number(form.get("price")), capacity: Number(form.get("capacity")) });
  }
  const eventDate = (value: string) => new Date(value).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Manila" });
  const eventTime = (value: string) => new Date(value).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  const levelLabel = (value: CommunityEvent["level"]) => value === "ALL_LEVELS" ? "All levels" : value[0] + value.slice(1).toLowerCase();
  const defaultStart = new Date(Date.now() + 2 * 86_400_000); defaultStart.setHours(9, 0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 4 * 3_600_000);
  return <section className="community-page">
    <div className="community-page-hero events-hero"><div><span className="community-eyebrow"><Trophy size={14}/> PUBLIC EVENT BOARD</span><h1>Events worth<br/><em>showing up for.</em></h1><p>Anyone can explore mixers and tournaments. Sign in to register or publish an event at an active venue.</p><div className="community-hero-actions"><button className="primary" type="button" onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}>Explore events <ArrowRight size={17}/></button><button className="secondary-action" type="button" onClick={() => auth.account ? setCreateOpen(true) : setAuthOpen(true)}>Host an event</button></div></div>
      <div className="event-feature"><span className="event-ribbon">FEATURED</span><div className="event-feature-date"><b>{featured ? new Date(featured.startsAt).getDate() : "—"}</b><span>{featured ? new Date(featured.startsAt).toLocaleDateString("en-PH", { month: "long", timeZone: "Asia/Manila" }).toUpperCase() : "NO DATE"}</span></div><div><span className="event-type">{featured?.category ?? "UPCOMING EVENT"}</span><h2>{featured?.title ?? "Choose another filter"}</h2><p><MapPin size={14}/>{featured ? `${featured.venue}, ${featured.area}` : "New events appear here"}</p><div className="event-tags">{featured && <><span>{featured.format}</span><span>{levelLabel(featured.level)}</span><span>{featured.spotsRemaining} spots left</span></>}</div></div><button type="button" disabled={!featured} onClick={() => featured && setSelected(featured)}>View event <ArrowRight size={16}/></button></div>
      <div className="community-hero-stats"><span><strong>{events.length}</strong> matching events</span><span><strong>{events.reduce((sum, event) => sum + event.registrations, 0)}</strong> registrations</span><span><strong>{events.reduce((sum, event) => sum + event.spotsRemaining, 0)}</strong> open spots</span></div></div>
    <div className="community-toolbar"><div><button className={category === "" ? "active" : ""} type="button" onClick={() => setCategory("")}>All events</button><button className={category === "SOCIAL" ? "active" : ""} type="button" onClick={() => setCategory("SOCIAL")}>Social</button><button className={category === "TOURNAMENT" ? "active" : ""} type="button" onClick={() => setCategory("TOURNAMENT")}>Tournaments</button></div><label className="filter-chip event-date-filter"><CalendarDays size={15}/><span className="sr-only">Event date</span><input aria-label="Event date" type="date" value={date} onChange={(event) => setDate(event.target.value)}/>{date && <button type="button" onClick={() => setDate("")} aria-label="Clear event date"><X/></button>}</label></div>
    {message && <div className="form-notice open-play-notice" role="status"><CheckCircle2/>{message}</div>}
    {registration.isError && <div className="form-error" role="alert">{registration.error.message}</div>}
    <div className="community-section-heading" ref={listRef}><div><span className="kicker">UP NEXT</span><h2>Save your spot</h2></div><button type="button" onClick={() => { setCategory(""); setDate(""); }}>View all events</button></div>
    {eventsQuery.isLoading ? <div className="empty"><Clock3/><h3>Loading events</h3></div> : events.length ? <div className="event-list">{events.map((event, index) => { const start = new Date(event.startsAt); return <article className={`event-card ${event.registered ? "registered" : ""}`} key={event.eventId}><div className={`event-date ${index % 3 === 1 ? "blue" : index % 3 === 2 ? "green" : "coral"}`}><strong>{start.getDate()}</strong><span>{start.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}</span></div><div className="event-details"><span className="status-line"><CheckCircle2 size={14}/>{event.registered ? "YOU’RE REGISTERED" : event.spotsRemaining ? "REGISTRATION OPEN" : "EVENT FULL"}</span><h3>{event.title}</h3><p><MapPin size={14}/>{event.venue} · {event.area}</p><small>{event.format} · {levelLabel(event.level)} · {event.registrations}/{event.capacity} players</small></div><div className="event-price"><span>from</span><strong>{money(event.price, event.currencyCode)}</strong><button type="button" aria-label={`View ${event.title}`} onClick={() => setSelected(event)}><ChevronRight/></button></div></article>; })}</div> : <div className="empty"><CalendarDays/><h3>No matching events</h3><p>Try another category or date, or host a new event.</p><button onClick={() => { setCategory(""); setDate(""); }}>Clear filters</button></div>}
    <div className="community-callout"><span><Trophy/></span><div><strong>Have an event idea?</strong><p>Publish a social mixer or tournament at an active PickleTayo venue.</p></div><button type="button" onClick={() => auth.account ? setCreateOpen(true) : setAuthOpen(true)}><Plus size={17}/> Host an event</button></div>
    {selected && <div className="overlay"><section className="modal event-detail-modal" role="dialog" aria-modal="true" aria-labelledby="event-detail-title"><button className="close" onClick={() => setSelected(null)} aria-label="Close"><X/></button><span className="kicker">{selected.category} · {levelLabel(selected.level)}</span><h2 id="event-detail-title">{selected.title}</h2><p className="event-detail-location"><MapPin/>{selected.venue} · {selected.area}</p><div className="event-detail-stats"><span><CalendarDays/><strong>{eventDate(selected.startsAt)}</strong><small>{eventTime(selected.startsAt)}–{eventTime(selected.endsAt)}</small></span><span><UsersRound/><strong>{selected.registrations}/{selected.capacity}</strong><small>{selected.spotsRemaining} spots remaining</small></span><span><CircleDollarSign/><strong>{money(selected.price, selected.currencyCode)}</strong><small>Demo registration fee</small></span></div><p className="event-detail-description">{selected.description}</p><div className="event-detail-actions"><button className="primary" disabled={registration.isPending || (!selected.registered && selected.spotsRemaining === 0)} onClick={() => changeRegistration(selected)}>{selected.registered ? "Cancel registration" : auth.account ? selected.spotsRemaining ? "Register for event" : "Event full" : "Sign in to register"}</button></div></section></div>}
    {createOpen && <div className="overlay"><section className="modal event-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title"><button className="close" onClick={() => setCreateOpen(false)} aria-label="Close"><X/></button><span className="kicker">NEW PUBLIC EVENT</span><h2 id="create-event-title">Host a player event</h2><p>Your event will be publicly visible and you will become its first registered player.</p><form className="operator-form" onSubmit={submitEvent}><label>Event name<input name="title" required minLength={4} placeholder="e.g. Friday Night Rally"/></label><label>Venue<select name="facilityId" required defaultValue=""><option value="" disabled>Select an active venue</option>{facilities.map((facility) => <option value={facility.facilityId} key={facility.facilityId}>{facility.name} · {facility.city}</option>)}</select></label><div className="form-row"><label>Starts<input name="startsAt" type="datetime-local" required defaultValue={defaultStart.toISOString().slice(0,16)}/></label><label>Ends<input name="endsAt" type="datetime-local" required defaultValue={defaultEnd.toISOString().slice(0,16)}/></label></div><div className="form-row"><label>Event type<select name="category"><option value="SOCIAL">Social mixer</option><option value="TOURNAMENT">Tournament</option></select></label><label>Skill level<select name="level"><option value="ALL_LEVELS">All levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option></select></label></div><div className="form-row"><label>Format<input name="format" required placeholder="e.g. Round robin"/></label><label>Player capacity<input name="capacity" type="number" min="4" max="256" defaultValue="32" required/></label></div><label>Registration fee<input name="price" type="number" min="0" step="50" defaultValue="0" required/></label><label>Event details<textarea name="description" required minLength={20} placeholder="Tell players what to expect, what to bring, and how the event will run."/></label>{createEvent.isError && <div className="form-error">{createEvent.error.message}</div>}<button className="primary" disabled={createEvent.isPending}>{createEvent.isPending ? "Publishing…" : "Publish public event"}</button></form></section></div>}
    {authOpen && <div className="overlay auth-overlay"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Sign in to Events"><button className="close" onClick={() => setAuthOpen(false)} aria-label="Close"><X/></button><AuthPanel reason="Sign in or create a player account to register for and host public PickleTayo events." onAuthenticated={() => setAuthOpen(false)}/></section></div>}
  </section>;
}

function ClubsPage({ facilities }: Pick<CommunityPagesProps, "facilities">) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<"NEARBY" | "ACTIVE" | "NEW">("NEARBY");
  const [area, setArea] = useState("");
  const [selected, setSelected] = useState<Club | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [message, setMessage] = useState("");
  const clubsQuery = useQuery({ queryKey: ["clubs", sort, area], queryFn: () => apiRequest<Page<Club>>(`/clubs?sort=${sort}&area=${encodeURIComponent(area)}`) });
  const clubs = clubsQuery.data?.content ?? [];
  const featured = clubs[0];
  const membership = useMutation({ mutationFn: (club: Club) => auth.request<Club>(`/clubs/${club.clubId}/join`, { method: club.joined ? "DELETE" : "POST" }), onSuccess: (club) => { setSelected((current) => current?.clubId === club.clubId ? club : current); setMessage(club.joined ? `You joined ${club.name}.` : `You left ${club.name}.`); void queryClient.invalidateQueries({ queryKey: ["clubs"] }); } });
  const createClub = useMutation({ mutationFn: (input: { name: string; area: string; schedule: string; description: string }) => auth.request<Club>("/clubs", { method: "POST", body: JSON.stringify(input) }), onSuccess: (club) => { setCreateOpen(false); setSort("NEW"); setArea(""); setMessage(`${club.name} was created and added to your clubs.`); void queryClient.invalidateQueries({ queryKey: ["clubs"] }); } });
  function changeMembership(club: Club) { if (!auth.account) { setAuthOpen(true); return; } membership.mutate(club); }
  function submitClub(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const facility = facilities.find((item) => item.facilityId === String(form.get("facilityId"))); if (!facility) { setMessage("Select a home venue."); return; } createClub.mutate({ name: String(form.get("name")), area: facility.city, schedule: String(form.get("schedule")), description: String(form.get("description")) }); }
  return <section className="community-page">
    <div className="community-page-hero clubs-hero"><div><span className="community-eyebrow"><UsersRound size={14}/> PUBLIC CLUB DIRECTORY</span><h1>Find your people.<br/><em>Grow your game.</em></h1><p>Anyone can explore local clubs. Sign in to join a community or start a public club at an active venue.</p><div className="community-hero-actions"><button className="primary" type="button" onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}>Find your club <ArrowRight size={17}/></button><button className="secondary-action" type="button" onClick={() => auth.account ? setCreateOpen(true) : setAuthOpen(true)}>Start a club</button></div></div><div className="club-feature"><div className="club-feature-mark">{featured?.initials ?? "PT"}</div><span className="club-verified"><CheckCircle2 size={14}/>{featured?.verified ? "VERIFIED CLUB" : "PLAYER CLUB"}</span><h2>{featured?.name ?? "Discover a club"}</h2><p>{featured?.description ?? "Choose a community and meet your next playing group."}</p><div><AvatarStack/><span><strong>{featured?.members ?? 0}</strong><small>members</small></span></div><button type="button" disabled={!featured || membership.isPending} onClick={() => featured && changeMembership(featured)}><UserPlus size={17}/>{featured?.joined ? "Leave club" : auth.account ? "Join club" : "Sign in to join"}</button></div><div className="community-hero-stats"><span><strong>{clubs.length}</strong> matching clubs</span><span><strong>{clubs.reduce((sum, club) => sum + club.members, 0)}</strong> listed members</span><span><strong>{clubs.filter((club) => club.verified).length}</strong> verified clubs</span></div></div>
    <div className="community-toolbar"><div><button className={sort === "NEARBY" ? "active" : ""} type="button" onClick={() => setSort("NEARBY")}>Near me</button><button className={sort === "ACTIVE" ? "active" : ""} type="button" onClick={() => setSort("ACTIVE")}>Most active</button><button className={sort === "NEW" ? "active" : ""} type="button" onClick={() => setSort("NEW")}>New clubs</button></div><label className="filter-chip"><MapPin size={15}/><select aria-label="Club location" value={area} onChange={(event) => setArea(event.target.value)}><option value="">All locations</option><option>Quezon City</option><option>Makati</option><option>Alabang</option></select></label></div>
    {message && <div className="form-notice open-play-notice" role="status"><CheckCircle2/>{message}</div>}
    {membership.isError && <div className="form-error">{membership.error.message}</div>}
    <div className="community-section-heading" ref={listRef}><div><span className="kicker">COMMUNITIES</span><h2>Clubs you’ll feel at home in</h2></div><button type="button" onClick={() => { setArea(""); setSort("NEARBY"); }}>See all clubs</button></div>
    {clubsQuery.isLoading ? <div className="empty"><UsersRound/><h3>Loading clubs</h3></div> : clubs.length ? <div className="club-grid">{clubs.map((club, index) => <article className={`club-card ${club.joined ? "joined" : ""}`} key={club.clubId}><div className={`club-cover ${index % 3 === 1 ? "blue" : index % 3 === 2 ? "sand" : "green"}`}><span>{club.initials}</span>{club.verified && <i><CheckCircle2 size={15}/></i>}</div><div className="club-card-body"><h3>{club.name}</h3><p><MapPin size={14}/>{club.area}</p><div className="club-member-line"><AvatarStack count={3}/><span><strong>{club.members}</strong> members</span></div><small><CalendarCheck size={14}/>{club.schedule}</small><button type="button" onClick={() => setSelected(club)}>View club <ChevronRight size={16}/></button></div></article>)}</div> : <div className="empty"><UsersRound/><h3>No clubs found</h3><p>Try another location or view all clubs.</p></div>}
    {selected && <div className="overlay"><section className="modal club-detail-modal" role="dialog" aria-modal="true" aria-labelledby="club-detail-title"><button className="close" onClick={() => setSelected(null)} aria-label="Close"><X/></button><div className="club-detail-mark">{selected.initials}</div><span className="kicker">{selected.verified ? "VERIFIED CLUB" : "PUBLIC PLAYER CLUB"}</span><h2 id="club-detail-title">{selected.name}</h2><p><MapPin size={15}/>{selected.area}</p><div className="club-detail-stats"><span><strong>{selected.members}</strong> members</span><span><strong>{selected.schedule}</strong> schedule</span></div><p className="club-description">{selected.description}</p><button className="primary book-button" disabled={membership.isPending} onClick={() => changeMembership(selected)}>{selected.joined ? "Leave club" : auth.account ? "Join this club" : "Sign in to join"}</button></section></div>}
    {createOpen && <div className="overlay"><section className="modal club-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-club-title"><button className="close" onClick={() => setCreateOpen(false)} aria-label="Close"><X/></button><span className="kicker">NEW PUBLIC CLUB</span><h2 id="create-club-title">Start a player club</h2><p>Your club will appear in the public directory. You will become its first member.</p><form className="operator-form" onSubmit={submitClub}><label>Club name<input name="name" required minLength={3} placeholder="e.g. Pasig Paddle Crew"/></label><label>Home venue<select name="facilityId" required defaultValue=""><option value="" disabled>Select an active venue</option>{facilities.map((facility) => <option value={facility.facilityId} key={facility.facilityId}>{facility.name} · {facility.city}</option>)}</select></label><label>Regular schedule<input name="schedule" required placeholder="e.g. Saturdays at 8:00 AM"/></label><label>About the club<textarea name="description" required minLength={20} placeholder="Tell players what kind of games and community to expect."/></label>{createClub.isError && <div className="form-error">{createClub.error.message}</div>}<button className="primary" disabled={createClub.isPending}>{createClub.isPending ? "Creating…" : "Create public club"}</button></form></section></div>}
    {authOpen && <div className="overlay auth-overlay"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Sign in to Clubs"><button className="close" onClick={() => setAuthOpen(false)} aria-label="Close"><X/></button><AuthPanel reason="Sign in or create a player account to join and start public PickleTayo clubs." onAuthenticated={() => setAuthOpen(false)}/></section></div>}
  </section>;
}

function ManagePage({ canManage, onOpenAdmin }: Pick<CommunityPagesProps, "canManage" | "onOpenAdmin">) {
  return <section className="community-page manage-page">
    <div className="manage-head"><div><span className="kicker">OPERATOR WORKSPACE</span><h1>Good afternoon.</h1><p>Here’s what’s happening across your pickleball facilities today.</p></div><div><button className="secondary-action" type="button"><CalendarDays size={17}/> Oct 6, 2026</button><button className="primary" type="button" onClick={onOpenAdmin}>{canManage ? "Open live console" : "Preview console"}<ArrowRight size={17}/></button></div></div>
    <div className="manage-metrics"><article><span className="metric-icon green"><CalendarCheck/></span><div><small>TODAY’S BOOKINGS</small><strong>28</strong><p><b>+12%</b> from last Tuesday</p></div></article><article><span className="metric-icon blue"><CircleDollarSign/></span><div><small>ESTIMATED REVENUE</small><strong>₱34,850</strong><p><b>+8%</b> week over week</p></div></article><article><span className="metric-icon violet"><UsersRound/></span><div><small>COURT UTILIZATION</small><strong>76%</strong><p>Peak time: 6–9 PM</p></div></article><article><span className="metric-icon amber"><Building2/></span><div><small>ACTIVE COURTS</small><strong>11 / 12</strong><p>1 marked for maintenance</p></div></article></div>
    <div className="manage-grid"><article className="manage-panel schedule-panel"><header><div><span className="kicker">LIVE SCHEDULE</span><h2>Today at Marina Courts</h2></div><button type="button">View all</button></header><div className="schedule-row"><time>5:00 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 1 · Santos party</strong><p>1 hour · Confirmed</p></div><span className="manage-status confirmed">Checked in</span></div><div className="schedule-row"><time>6:00 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 2 · Open Play</strong><p>2 hours · 9 players</p></div><span className="manage-status live">Live soon</span></div><div className="schedule-row"><time>7:30 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 1 · Reyes party</strong><p>1.5 hours · Paid</p></div><span className="manage-status confirmed">Confirmed</span></div><div className="schedule-row"><time>8:00 <small>PM</small></time><span className="schedule-line"/><div><strong>Court 3 · Club night</strong><p>2 hours · Makati Kitchen</p></div><span className="manage-status club">Club</span></div></article>
      <article className="manage-panel facility-health"><header><div><span className="kicker">FACILITY STATUS</span><h2>Operations overview</h2></div><button type="button"><Plus size={16}/> Add court</button></header><div className="health-score"><span><b>92</b><small>/100</small></span><div><strong>Everything looks good</strong><p>All essential services are operational.</p></div></div><ul><li><span><CheckCircle2/> Booking system</span><b>Operational</b></li><li><span><CheckCircle2/> Online payments</span><b>Operational</b></li><li><span><ShieldCheck/> Staff coverage</span><b>4 on duty</b></li><li><span><Clock3/> Court 4 maintenance</span><b className="warning">Until 4:30 PM</b></li></ul></article></div>
    <div className="manage-bottom"><div><span><Star/></span><div><strong>4.8 average venue rating</strong><p>Players mentioned your friendly staff 16 times this month.</p></div></div><button type="button">Read feedback <ChevronRight size={17}/></button></div>
  </section>;
}

export function CommunityPages(props: CommunityPagesProps) {
  if (props.page === "open-play") return <OpenPlayPage onDiscover={props.onDiscover} facilities={props.facilities}/>;
  if (props.page === "events") return <EventsPage facilities={props.facilities}/>;
  if (props.page === "clubs") return <ClubsPage facilities={props.facilities}/>;
  return <ManagePage canManage={props.canManage} onOpenAdmin={props.onOpenAdmin}/>;
}
