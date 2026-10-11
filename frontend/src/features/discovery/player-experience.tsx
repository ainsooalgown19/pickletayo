"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  Home,
  LocateFixed,
  LogOut,
  MapPin,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { usePreferences } from "@/stores/preferences";
import { track } from "@/lib/analytics";
import { AuthPanel } from "@/features/auth/auth-panel";
import { useAuth } from "@/features/auth/auth-context";
import { AccountSettings } from "@/features/account/account-settings";
import { CommunityPages, type CommunityPage } from "@/features/discovery/community-pages";
import { ApiError, apiRequest } from "@/lib/api/client";
import {
  type AvailabilitySlot,
  type Booking,
  type FacilityAvailability,
  type FacilityDetail,
  type FacilitySummary,
  type Page,
  localDate,
  money,
} from "@/lib/api/contracts";

const facilityArtwork = [
  { tone: "mint", image: "/courts/riverside-indoor.png" },
  { tone: "blue", image: "/courts/skyline-rooftop.png" },
  { tone: "sand", image: "/courts/garden-city.png" },
] as const;

function artwork(id: string) {
  const hash = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return facilityArtwork[hash % facilityArtwork.length];
}

function timeLabel(value: string, timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(value));
}

function dateLabel(value: string, timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone }).format(new Date(value));
}

function remainingLabel(expiresAt: string, now: number) {
  const seconds=Math.max(0,Math.floor((new Date(expiresAt).getTime()-now)/1000));
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
}

export function PlayerExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "home" | "discover" | "bookings" | "profile" | CommunityPage
  >("home");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [courtType, setCourtType] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<FacilitySummary | null>(null);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingDate, setBookingDate] = useState(localDate());
  const [booking, setBooking] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { theme, setTheme } = usePreferences();
  const auth = useAuth();
  const { account, status } = auth;
  const queryClient = useQueryClient();
  const facilitiesQuery = useQuery({
    queryKey: ["facilities", search, city, courtType, page],
    queryFn: () => apiRequest<Page<FacilitySummary>>(`/facilities?size=9&page=${page}&query=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}${courtType ? `&courtType=${courtType}` : ""}`),
  });
  const detailQuery = useQuery({
    queryKey: ["facility", selected?.facilityId],
    queryFn: () => apiRequest<FacilityDetail>(`/facilities/${selected!.facilityId}`),
    enabled: Boolean(selected),
  });
  const availabilityQuery = useQuery({
    queryKey: ["availability", selected?.facilityId, bookingDate],
    queryFn: () => apiRequest<FacilityAvailability>(`/facilities/${selected!.facilityId}/availability?date=${bookingDate}&durationMinutes=60`),
    enabled: Boolean(selected),
  });
  const holdMutation = useMutation({
    mutationFn: () => {
      if (!slot) throw new Error("Select an available time.");
      return auth.request<Booking>("/bookings/holds", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ courtId: slot.courtId, startsAt: slot.startsAt, endsAt: slot.endsAt }),
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setBooking(false);
      setSelected(null);
      setConfirmed(true);
      track("booking_hold_created", { bookingId: created.bookingId, facilityId: created.facilityId });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["availability", selected?.facilityId] }),
  });
  const initials = account
    ? `${account.givenName[0] ?? ""}${account.familyName[0] ?? ""}`.toUpperCase()
    : null;
  const canManage = account?.roles.some((role) => ["PLATFORM_ADMIN", "COURT_OWNER", "STAFF"].includes(role)) ?? false;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => { const stored=localStorage.getItem("pickletayo-favorites"); if(stored) { try { setFavorites(JSON.parse(stored) as string[]); } catch { localStorage.removeItem("pickletayo-favorites"); } } }, []);
  useEffect(() => { localStorage.setItem("pickletayo-favorites",JSON.stringify(favorites)); }, [favorites]);
  const shown = useMemo(() => (facilitiesQuery.data?.content ?? []).filter((facility) => maxPrice === null || facility.startingHourlyRate <= maxPrice), [facilitiesQuery.data,maxPrice]);

  function chooseFacility(facility: FacilitySummary) {
    setSelected(facility);
    setSlot(null);
    setBookingDate(localDate());
    track("facility_view", { facilityId: facility.facilityId });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setActiveTab("home")}
          aria-label="PickleTayo home"
        >
          <img className="brand-mark" src="/brand/pickletayo-mark.svg" alt="" width="36" height="45" />
          <span className="brand-wordmark">
            <span className="brand-pickle">Pickle</span>
            <span className="brand-tayo">Tayo</span>
          </span>
        </button>
        <nav className="desktop-nav" aria-label="Primary">
          <button className={activeTab === "home" || activeTab === "discover" ? "active" : ""} onClick={() => setActiveTab("home")}>Discover</button>
          <button className={activeTab === "open-play" ? "active" : ""} onClick={() => setActiveTab("open-play")}>Open Play</button>
          <button className={activeTab === "events" ? "active" : ""} onClick={() => setActiveTab("events")}>Events</button>
          <button className={activeTab === "clubs" ? "active" : ""} onClick={() => setActiveTab("clubs")}>Clubs</button>
          <button className={activeTab === "manage" ? "active" : ""} onClick={() => setActiveTab("manage")}>Manage</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Notifications">
            <Bell size={19} />
            <i />
          </button>
          <button
            className="icon-button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <button className="avatar" aria-label={account ? `Open ${account.givenName}'s profile` : "Sign in or create an account"} onClick={() => setActiveTab("profile")}>
            {status === "loading" ? "…" : initials ?? <UserRound size={19} />}
          </button>
        </div>
      </header>

      <main>
        {activeTab === "home" ? (
          <>
            <section className="hero" id="discover">
              <div className="eyebrow">
                <Sparkles size={14} /> Your court is waiting
              </div>
              <h1>
                Play more.
                <br />
                <em>Find your court.</em>
              </h1>
              <p>
                Discover the best pickleball courts near you, check live
                availability, and get on the court in minutes.
              </p>
              <form
                className="search-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(0);
                  setSearch(query.trim());
                  track("facility_search", { query });
                }}
              >
                <Search aria-hidden="true" />
                <label className="sr-only" htmlFor="court-search">
                  Search courts
                </label>
                <input
                  id="court-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by venue or neighborhood"
                />
                <button type="button" className="location" title="Distance sorting requires location permission and is not enabled yet" disabled>
                  <LocateFixed size={18} /> Near me
                </button>
                <button type="submit" className="primary">
                  Find courts
                </button>
              </form>
              <div className="quick-filters">
                <span>Popular:</span>
                <button className={courtType === "INDOOR" ? "active" : ""} onClick={() => {setCourtType(courtType === "INDOOR" ? "" : "INDOOR");setPage(0);}}>Indoor</button>
                <button className={courtType === "OUTDOOR" ? "active" : ""} onClick={() => {setCourtType(courtType === "OUTDOOR" ? "" : "OUTDOOR");setPage(0);}}>Outdoor</button>
                <button className={maxPrice === 1000 ? "active" : ""} onClick={() => setMaxPrice(maxPrice === 1000 ? null : 1000)}>Under ₱1,000</button>
                <button disabled title="Ratings are not available yet">Top rated</button>
              </div>
              <div className="discovery-filters"><label>City<input value={city} onChange={(event)=>{setCity(event.target.value);setPage(0);}} placeholder="e.g. Quezon City"/></label><label>Court type<select value={courtType} onChange={(event)=>{setCourtType(event.target.value);setPage(0);}}><option value="">All court types</option><option value="INDOOR">Indoor</option><option value="OUTDOOR">Outdoor</option><option value="COVERED">Covered</option></select></label><button onClick={()=>{setCity("");setCourtType("");setMaxPrice(null);setPage(0);}}>Clear filters</button></div>
            </section>

            <section className="content-section">
              <div className="section-heading">
                <div>
                  <span className="kicker">NEAR YOU</span>
                  <h2>Courts ready to play</h2>
                  <p>{facilitiesQuery.isLoading ? "Loading live facilities…" : `${facilitiesQuery.data?.totalElements ?? 0} facilities match your search.`}</p>
                </div>
                <button className="filter-button">
                  <SlidersHorizontal size={17} /> Filters
                </button>
              </div>
              {facilitiesQuery.isError ? (
                <div className="empty api-state" role="alert">
                  <Search />
                  <h3>Live courts are unavailable</h3>
                  <p>{facilitiesQuery.error instanceof ApiError ? facilitiesQuery.error.message : "The PickleTayo API could not be reached."}</p>
                  <button onClick={() => facilitiesQuery.refetch()}>Try again</button>
                </div>
              ) : facilitiesQuery.isLoading ? (
                <div className="empty api-state" role="status"><Clock3 /><h3>Loading courts</h3><p>Checking live facility inventory…</p></div>
              ) : shown.length ? (
                <div className="facility-grid">
                  {shown.map((facility) => (
                    <article className="facility-card" key={facility.facilityId}>
                      <button
                        className="card-image"
                        data-tone={artwork(facility.facilityId).tone}
                        onClick={() => chooseFacility(facility)}
                        aria-label={`View ${facility.name}`}
                      >
                        <Image
                          src={artwork(facility.facilityId).image}
                          alt={`${facility.name} pickleball courts`}
                          fill
                          sizes="(max-width: 800px) 100vw, 33vw"
                        />
                        <b>Bookable venue</b>
                        <small>
                          <MapPin size={14} />
                          {facility.city}
                        </small>
                      </button>
                      <button
                        className={`favorite ${favorites.includes(facility.facilityId) ? "saved" : ""}`}
                        onClick={() =>
                          setFavorites((items) =>
                            items.includes(facility.facilityId)
                              ? items.filter((id) => id !== facility.facilityId)
                              : [...items, facility.facilityId],
                          )
                        }
                        aria-label={`${favorites.includes(facility.facilityId) ? "Remove" : "Add"} ${facility.name} ${favorites.includes(facility.facilityId) ? "from" : "to"} favorites`}
                      >
                        <Heart size={18} />
                      </button>
                      <div className="card-body">
                        <div className="rating">
                          <CheckCircle2 size={15} /> LIVE AVAILABILITY
                        </div>
                        <h3>{facility.name}</h3>
                        <p>
                          <MapPin size={15} />
                          {facility.city}, {facility.province}
                        </p>
                        <div className="facility-meta">
                          <span>{facility.activeCourts} courts</span>
                          <span>Active facility</span>
                        </div>
                        <div className="card-footer">
                          <div>
                            from <strong>{money(facility.startingHourlyRate, facility.currencyCode)}</strong>
                            <small>/ hour</small>
                          </div>
                          <button
                            className="arrow-button"
                            onClick={() => chooseFacility(facility)}
                            aria-label={`View ${facility.name}`}
                          >
                            <ChevronRight />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <Search />
                  <h3>No courts found</h3>
                  <p>Try another venue or neighborhood.</p>
                  <button onClick={() => { setQuery(""); setSearch(""); }}>Clear search</button>
                </div>
              )}
              {facilitiesQuery.data && facilitiesQuery.data.totalPages > 1 && <div className="pagination"><button disabled={page===0} onClick={()=>setPage((value)=>value-1)}>Previous</button><span>Page {page+1} of {facilitiesQuery.data.totalPages}</span><button disabled={page+1>=facilitiesQuery.data.totalPages} onClick={()=>setPage((value)=>value+1)}>Next</button></div>}
            </section>

            <section className="community" id="play">
              <div>
                <span className="kicker">OPEN PLAY</span>
                <h2>Show up. Team up. Play.</h2>
                <p>
                  Join a welcoming session nearby. We’ll match you with players
                  at your level—no group chat required.
                </p>
                <button className="primary" onClick={() => setActiveTab("open-play")}>
                  Explore open play <ChevronRight size={18} />
                </button>
              </div>
              <div className="queue-card">
                <div className="queue-head">
                  <span className="live-dot" /> Live at Marina Courts{" "}
                  <b>12 playing</b>
                </div>
                <div className="court-graphic">
                  <span>COURT 2</span>
                  <div className="players">
                    <i>JS</i>
                    <i>MC</i>
                    <i>LT</i>
                    <i>AK</i>
                  </div>
                </div>
                <div className="queue-footer">
                  <UsersRound size={18} />
                  <span>
                    <strong>Next game in ~8 min</strong>3 players waiting
                  </span>
                  <button>Join queue</button>
                </div>
              </div>
            </section>
          </>
        ) : activeTab === "open-play" || activeTab === "events" || activeTab === "clubs" || activeTab === "manage" ? (
          <CommunityPages
            page={activeTab}
            canManage={canManage}
            onDiscover={() => setActiveTab("home")}
            onOpenAdmin={() => canManage ? router.push("/admin") : setActiveTab("profile")}
          />
        ) : (
          <StaticTab
            tab={activeTab}
            facilities={shown}
            facilitiesLoading={facilitiesQuery.isLoading}
            onDiscover={() => setActiveTab("discover")}
            onBook={() => {
              setActiveTab("discover");
              window.scrollTo({ top: 0 });
            }}
            onCommunityPage={(page) => setActiveTab(page)}
          />
        )}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          className={activeTab === "home" ? "active" : ""}
          aria-current={activeTab === "home" ? "page" : undefined}
          onClick={() => setActiveTab("home")}
        >
          <Home />
          Home
        </button>
        <button
          className={activeTab === "discover" ? "active" : ""}
          aria-current={activeTab === "discover" ? "page" : undefined}
          onClick={() => setActiveTab("discover")}
        >
          <Compass />
          Discover
        </button>
        <button
          className={activeTab === "bookings" ? "active" : ""}
          aria-current={activeTab === "bookings" ? "page" : undefined}
          onClick={() => setActiveTab("bookings")}
        >
          <CalendarDays />
          Bookings
        </button>
        <button
          className={activeTab === "profile" ? "active" : ""}
          aria-current={activeTab === "profile" ? "page" : undefined}
          onClick={() => setActiveTab("profile")}
        >
          <UserRound />
          Profile
        </button>
        {canManage && <button className={activeTab === "manage" ? "active" : ""} aria-current={activeTab === "manage" ? "page" : undefined} onClick={() => setActiveTab("manage")}><Settings />Manage</button>}
      </nav>

      {selected && (
        <div
          className="overlay"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="facility-title"
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X />
            </button>
            <div className="drawer-visual" data-tone={artwork(selected.facilityId).tone}>
              <Image
                src={artwork(selected.facilityId).image}
                alt={`${selected.name} pickleball courts`}
                fill
                sizes="500px"
              />
            </div>
            <span className="kicker">LIVE COURT AVAILABILITY</span>
            <h2 id="facility-title">{selected.name}</h2>
            <p className="drawer-location">
              <MapPin size={16} />
              {selected.city}, {selected.province}
            </p>
            <div className="detail-stats">
              <span>
                <strong>{detailQuery.data?.location.verified ? "Verified" : "Listed"}</strong> venue
              </span>
              <span>
                <strong>{selected.activeCourts}</strong> courts
              </span>
              <span>
                <strong>{money(selected.startingHourlyRate, selected.currencyCode)}</strong> / hour
              </span>
            </div>
            <label className="booking-date-field">
              <span>Select a date</span>
              <input type="date" value={bookingDate} min={localDate(0)} onChange={(event) => { setBookingDate(event.target.value); setSlot(null); }} />
            </label>
            <h3>Select a 60-minute time</h3>
            <div className="slots">
              {availabilityQuery.data?.slots.map((available) => (
                <button
                  key={`${available.courtId}-${available.startsAt}`}
                  className={slot?.courtId === available.courtId && slot.startsAt === available.startsAt ? "selected" : ""}
                  onClick={() => setSlot(available)}
                >
                  <Clock3 size={15} />
                  <span>{timeLabel(available.startsAt, availabilityQuery.data.timezone)}<small>{available.courtName} · {money(available.price, available.currencyCode)}</small></span>
                </button>
              ))}
            </div>
            {availabilityQuery.isLoading && <p className="inline-state">Checking available courts…</p>}
            {availabilityQuery.isError && <p className="inline-error" role="alert">Could not load availability. <button onClick={() => availabilityQuery.refetch()}>Try again</button></p>}
            {availabilityQuery.isSuccess && availabilityQuery.data.slots.length === 0 && <p className="inline-state">No 60-minute courts are available on this date. Try another day.</p>}
            <button
              className="primary book-button"
              disabled={!slot}
              onClick={() => {
                if (account) setBooking(true);
                else setAuthOpen(true);
                track("booking_started", { facilityId: selected.facilityId });
              }}
            >
              Continue to booking
            </button>
          </section>
        </div>
      )}

      {booking && selected && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <button
              className="close"
              onClick={() => setBooking(false)}
              aria-label="Close"
            >
              <X />
            </button>
            <span className="kicker">SECURE CHECKOUT</span>
            <h2 id="checkout-title">Review your booking</h2>
            <div className="booking-summary">
              <strong>{selected.name}</strong>
              <span>{slot ? `${dateLabel(slot.startsAt)} · ${timeLabel(slot.startsAt)}` : "Select a time"}</span>
              <span>{slot?.courtName} · 60 minutes</span>
            </div>
            <dl>
              <div>
                <dt>Court rental</dt>
                <dd>{slot ? money(slot.price, slot.currencyCode) : "—"}</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{slot ? money(slot.price, slot.currencyCode) : "—"}</dd>
              </div>
            </dl>
            <p className="secure-note">
              This creates a 10-minute court hold. Online payment is not enabled yet; the hold will expire automatically if it is not completed.
            </p>
            {holdMutation.isError && <p className="inline-error" role="alert">{holdMutation.error instanceof Error ? holdMutation.error.message : "The court could not be held."}</p>}
            <button className="primary book-button" disabled={holdMutation.isPending} onClick={() => holdMutation.mutate()}>
              {holdMutation.isPending ? "Holding court…" : "Hold court for 10 minutes"}
            </button>
          </section>
        </div>
      )}

      {confirmed && (
        <div className="toast" role="status">
          <span>✓</span>
          <div>
            <strong>Court held for 10 minutes</strong>
            <p>Your hold is now visible in Bookings. Payment integration comes next.</p>
          </div>
          <button onClick={() => setConfirmed(false)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {authOpen && (
        <div className="overlay auth-overlay" role="presentation">
          <section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Player account">
            <button className="close" onClick={() => setAuthOpen(false)} aria-label="Close"><X /></button>
            <AuthPanel
              reason="Sign in or create your player account to continue this booking."
              onAuthenticated={() => {
                setAuthOpen(false);
                setBooking(true);
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}

function StaticTab({
  tab,
  facilities,
  facilitiesLoading,
  onDiscover,
  onBook,
  onCommunityPage,
}: {
  tab: "discover" | "bookings" | "profile";
  facilities: FacilitySummary[];
  facilitiesLoading: boolean;
  onDiscover: () => void;
  onBook: () => void;
  onCommunityPage: (page: Exclude<CommunityPage, "manage">) => void;
}) {
  const auth = useAuth();
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({
    queryKey: ["bookings", auth.account?.userId],
    queryFn: () => auth.request<Page<Booking>>("/bookings?size=50&sort=createdAt,desc"),
    enabled: tab === "bookings" && Boolean(auth.account),
    refetchInterval: tab === "bookings" ? 30_000 : false,
  });
  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => auth.request<Booking>(`/bookings/${bookingId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
  if (tab === "discover")
    return (
      <section className="static-screen">
        <div className="mobile-page-head">
          <span className="kicker">DISCOVER</span>
          <h1>Find your next game</h1>
          <p>Browse courts, open play sessions, clubs, and events near you.</p>
        </div>
        <div className="static-search">
          <Search size={19} />
          <span>Search courts and activities</span>
          <SlidersHorizontal size={18} />
        </div>
        <div className="category-grid">
          <button onClick={onBook}>
            <span>
              <MapPin />
            </span>
            <strong>Courts</strong>
          <small>{facilitiesLoading ? "Loading…" : `${facilities.length} available`}</small>
          </button>
          <button onClick={() => onCommunityPage("open-play")}>
            <span>
              <UsersRound />
            </span>
            <strong>Open Play</strong>
            <small>8 today</small>
          </button>
          <button onClick={() => onCommunityPage("events")}>
            <span>
              <Trophy />
            </span>
            <strong>Events</strong>
            <small>12 upcoming</small>
          </button>
          <button onClick={() => onCommunityPage("clubs")}>
            <span>
              <Heart />
            </span>
            <strong>Clubs</strong>
            <small>Find your crew</small>
          </button>
        </div>
        <div className="static-section-title">
          <div>
            <span className="kicker">TRENDING</span>
            <h2>Popular near you</h2>
          </div>
          <button>See all</button>
        </div>
        <div className="compact-list">
          {facilities.map((facility) => (
            <button className="compact-row" key={facility.facilityId} onClick={onBook}>
                <span className="compact-art" data-tone={artwork(facility.facilityId).tone}>
                  <Image src={artwork(facility.facilityId).image} alt="" fill sizes="64px" />
                </span>
              <span>
                <strong>{facility.name}</strong>
                <small>
                  <MapPin size={13} />
                  {facility.city}, {facility.province}
                </small>
                <small>
                  <CheckCircle2 size={13} />
                  {facility.activeCourts} courts · from {money(facility.startingHourlyRate, facility.currencyCode)}/hr
                </small>
              </span>
              <ChevronRight />
            </button>
          ))}
        </div>
      </section>
    );

  if (tab === "bookings")
    return (
      <section className="static-screen">
        <div className="mobile-page-head">
          <span className="kicker">YOUR SCHEDULE</span>
          <h1>Bookings</h1>
          <p>Everything you need for your next time on court.</p>
        </div>
        {auth.status === "loading" ? (
          <div className="auth-loading">Loading your account…</div>
        ) : !auth.account ? (
          <AuthPanel reason="Sign in to see your court holds and bookings." />
        ) : bookingsQuery.isLoading ? (
          <div className="empty api-state" role="status"><Clock3 /><h3>Loading bookings</h3><p>Checking your latest reservations…</p></div>
        ) : bookingsQuery.isError ? (
          <div className="empty api-state" role="alert"><CalendarDays /><h3>Bookings unavailable</h3><p>{bookingsQuery.error instanceof Error ? bookingsQuery.error.message : "Could not load your bookings."}</p><button onClick={() => bookingsQuery.refetch()}>Try again</button></div>
        ) : bookingsQuery.data?.content.length ? (
          <div className="booking-list">
            {bookingsQuery.data.content.map((item) => {
              const starts = new Date(item.startsAt);
              const venue = facilities.find((facility) => facility.facilityId === item.facilityId);
              const cancellable = ["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(item.status);
              return (
                <article className="booking-card-static" key={item.bookingId}>
                  <div className="booking-date"><strong>{starts.getDate()}</strong><span>{starts.toLocaleDateString("en-PH", { month: "short" }).toUpperCase()}</span></div>
                  <div className="booking-info">
                    <span className="status-line"><CheckCircle2 size={15} /> {item.status.replaceAll("_", " ")}</span>
                    <h2>{venue?.name ?? `Booking ${item.reference}`}</h2>
                    <p>{dateLabel(item.startsAt)} · {timeLabel(item.startsAt)}–{timeLabel(item.endsAt)}</p>
                    <small>{item.reference} · {money(item.totalAmount, item.currencyCode)}</small>
                    {item.holdExpiresAt && ["HOLD", "PENDING_PAYMENT"].includes(item.status) && <small className="hold-countdown">Hold remaining {remainingLabel(item.holdExpiresAt,now)}</small>}
                    {item.status === "HOLD" && <button className="payment-coming" disabled title="Payment provider integration is the next backend milestone">Continue to payment</button>}
                  </div>
                  {cancellable && <button aria-label={`Cancel ${item.reference}`} disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(item.bookingId)}><X /></button>}
                </article>
              );
            })}
            {cancelMutation.isError && <p className="inline-error" role="alert">{cancelMutation.error instanceof Error ? cancelMutation.error.message : "Booking could not be cancelled."}</p>}
          </div>
        ) : (
          <div className="empty api-state"><CalendarDays /><h3>No bookings yet</h3><p>Your court holds and confirmed bookings will appear here.</p><button onClick={onDiscover}>Find a court</button></div>
        )}
        <div className="static-promo">
          <div>
            <span className="kicker">KEEP PLAYING</span>
            <h2>Ready for another game?</h2>
            <p>Fresh court times are available near you.</p>
          </div>
          <button className="primary" onClick={onDiscover}>
            Find a court
          </button>
        </div>
      </section>
    );

  if (auth.status === "loading") return <section className="static-screen"><div className="auth-loading">Loading your account…</div></section>;

  if (!auth.account) return <section className="static-screen auth-screen"><AuthPanel /></section>;

  const account = auth.account;
  const initials = `${account.givenName[0] ?? ""}${account.familyName[0] ?? ""}`.toUpperCase();
  const joined = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(account.createdAt));

  return (
    <section className="static-screen profile-screen">
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h1>{account.givenName} {account.familyName}</h1>
          <p>{account.email}</p>
          <span>{account.emailVerified ? "Verified player account" : "Email verification required"}</span>
        </div>
        <Settings size={21} aria-label="Account settings" />
      </div>
      <div className="rating-panel">
        <div>
          <span>Account</span>
          <strong>{account.status === "ACTIVE" ? "Active" : account.status}</strong>
          <small>Current status</small>
        </div>
        <div>
          <span>Role</span>
          <strong>{account.roles.includes("PLAYER") ? "Player" : account.roles[0] ?? "Member"}</strong>
          <small>Access level</small>
        </div>
        <div>
          <span>Joined</span>
          <strong>{joined}</strong>
          <small>PickleTayo member</small>
        </div>
      </div>
      <AccountSettings />
      <button className="sign-out" onClick={() => auth.signOut()}>
        <LogOut size={18} /> Sign out
      </button>
    </section>
  );
}
