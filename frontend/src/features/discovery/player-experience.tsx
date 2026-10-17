"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  CreditCard,
  Heart,
  Home,
  LocateFixed,
  LogOut,
  MapPin,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  WalletCards,
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
  type CommunityEvent,
  type FacilityAvailability,
  type FacilityDetail,
  type FacilitySummary,
  type OpenPlaySession,
  type Page,
  localDate,
  money,
} from "@/lib/api/contracts";
import { demoMode } from "@/demo/demo-api";

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
  const [checkoutStep, setCheckoutStep] = useState<"review" | "payment">("review");
  const [paymentMethod, setPaymentMethod] = useState<"PAY_AT_VENUE" | "GCASH_DEMO" | "CARD_DEMO">("PAY_AT_VENUE");
  const [authOpen, setAuthOpen] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<{ booking: Booking; facilityName: string; paymentMethod: "PAY_AT_VENUE" | "GCASH_DEMO" | "CARD_DEMO" } | null>(null);
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
        body: JSON.stringify({ courtId: slot.courtId, startsAt: slot.startsAt, endsAt: slot.endsAt, paymentMethod: demoMode ? paymentMethod : "PAY_AT_VENUE" }),
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (selected) setCompletedBooking({ booking: created, facilityName: selected.name, paymentMethod });
      setBooking(false);
      setSelected(null);
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
          <button className={activeTab === "bookings" ? "active" : ""} onClick={() => setActiveTab("bookings")}>Bookings</button>
          <button className={activeTab === "open-play" ? "active" : ""} onClick={() => setActiveTab("open-play")}>Open Play</button>
          <button className={activeTab === "events" ? "active" : ""} onClick={() => setActiveTab("events")}>Events</button>
          <button className={activeTab === "clubs" ? "active" : ""} onClick={() => setActiveTab("clubs")}>Clubs</button>
          {canManage && <button className={activeTab === "manage" ? "active" : ""} onClick={() => router.push("/admin")}>Manage</button>}
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
            facilities={facilitiesQuery.data?.content ?? []}
            onDiscover={() => setActiveTab("home")}
            onOpenAdmin={() => canManage ? router.push("/admin") : setActiveTab("profile")}
          />
        ) : (
          <StaticTab
            tab={activeTab}
            facilities={shown}
            facilitiesLoading={facilitiesQuery.isLoading}
            onDiscover={() => setActiveTab("discover")}
            onSelectFacility={chooseFacility}
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
        {canManage && <button className={activeTab === "manage" ? "active" : ""} aria-current={activeTab === "manage" ? "page" : undefined} onClick={() => router.push("/admin")}><Settings />Manage</button>}
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
                if (account) { setCheckoutStep("review"); setBooking(true); }
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
            <div className="checkout-steps" aria-label="Booking progress">
              <span className={checkoutStep === "review" ? "active" : "done"}><b>1</b> Review</span>
              <i />
              <span className={checkoutStep === "payment" ? "active" : ""}><b>2</b> Payment</span>
            </div>
            <span className="kicker">PLAYER CHECKOUT</span>
            <h2 id="checkout-title">{checkoutStep === "review" ? "Review your booking" : "Choose how to pay"}</h2>
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
            {checkoutStep === "review" ? <>
              <p className="secure-note">You can review the payment method before confirming. Nothing is charged on this step.</p>
              <button className="primary book-button" onClick={() => setCheckoutStep("payment")}>Continue to payment</button>
            </> : <>
              <div className="payment-methods" role="radiogroup" aria-label="Payment method">
                <button className={paymentMethod === "PAY_AT_VENUE" ? "selected" : ""} role="radio" aria-checked={paymentMethod === "PAY_AT_VENUE"} onClick={() => setPaymentMethod("PAY_AT_VENUE")}><WalletCards/><span><strong>Pay at the venue</strong><small>Reserve now and pay when you arrive</small></span><i /></button>
                {demoMode && <button className={paymentMethod === "GCASH_DEMO" ? "selected" : ""} role="radio" aria-checked={paymentMethod === "GCASH_DEMO"} onClick={() => setPaymentMethod("GCASH_DEMO")}><span className="payment-brand">G</span><span><strong>GCash demo</strong><small>Simulate an instant wallet payment</small></span><i /></button>}
                {demoMode && <button className={paymentMethod === "CARD_DEMO" ? "selected" : ""} role="radio" aria-checked={paymentMethod === "CARD_DEMO"} onClick={() => setPaymentMethod("CARD_DEMO")}><CreditCard/><span><strong>Card demo</strong><small>Simulate Visa or Mastercard payment</small></span><i /></button>}
              </div>
              <p className="secure-note payment-demo-note"><ShieldCheck/> {demoMode ? "Demo payment only—no real money or payment details are used." : "Online payment is not enabled. Choose pay at the venue to continue."}</p>
              {holdMutation.isError && <p className="inline-error" role="alert">{holdMutation.error instanceof Error ? holdMutation.error.message : "The booking could not be confirmed."}</p>}
              <div className="checkout-actions"><button className="checkout-back" onClick={() => setCheckoutStep("review")}><ArrowLeft/> Back</button><button className="primary" disabled={holdMutation.isPending} onClick={() => holdMutation.mutate()}>{holdMutation.isPending ? "Processing…" : paymentMethod === "PAY_AT_VENUE" ? "Confirm booking" : `Pay ${slot ? money(slot.price, slot.currencyCode) : ""}`}</button></div>
            </>}
          </section>
        </div>
      )}

      {completedBooking && (
        <div className="overlay confirmation-overlay">
          <section className="modal booking-confirmation" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <span className="confirmation-check"><CheckCircle2/></span>
            <span className="kicker">RESERVATION COMPLETE</span>
            <h2 id="confirmation-title">Booking confirmed</h2>
            <p>Your court is ready. We’ve added this reservation to your bookings.</p>
            <div className="confirmation-reference"><small>BOOKING REFERENCE</small><strong>{completedBooking.booking.reference}</strong></div>
            <dl><div><dt>Venue</dt><dd>{completedBooking.facilityName}</dd></div><div><dt>Schedule</dt><dd>{dateLabel(completedBooking.booking.startsAt)} · {timeLabel(completedBooking.booking.startsAt)}</dd></div><div><dt>Payment</dt><dd>{completedBooking.booking.paymentStatus === "PAID" ? "Paid · Demo" : "Pay at venue"}</dd></div><div className="total"><dt>Total</dt><dd>{money(completedBooking.booking.totalAmount, completedBooking.booking.currencyCode)}</dd></div></dl>
            <button className="primary book-button" onClick={() => { setCompletedBooking(null); setActiveTab("bookings"); }}>View my bookings</button>
            <button className="confirmation-secondary" onClick={() => setCompletedBooking(null)}>Book another court</button>
          </section>
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
  onSelectFacility,
  onCommunityPage,
}: {
  tab: "discover" | "bookings" | "profile";
  facilities: FacilitySummary[];
  facilitiesLoading: boolean;
  onDiscover: () => void;
  onSelectFacility: (facility: FacilitySummary) => void;
  onCommunityPage: (page: Exclude<CommunityPage, "manage">) => void;
}) {
  const auth = useAuth();
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({
    queryKey: ["bookings", auth.account?.userId],
    queryFn: () => auth.request<Page<Booking>>("/bookings?size=50&sort=createdAt,desc"),
    enabled: tab === "bookings" && Boolean(auth.account),
    refetchInterval: tab === "bookings" ? 30_000 : false,
  });
  const openPlayQuery = useQuery({
    queryKey: ["open-play", "player-activity", auth.account?.userId],
    queryFn: () => apiRequest<Page<OpenPlaySession>>("/open-play?range=WEEK&level="),
    enabled: tab === "bookings" && Boolean(auth.account),
  });
  const eventsQuery = useQuery({
    queryKey: ["events", "player-activity", auth.account?.userId],
    queryFn: () => apiRequest<Page<CommunityEvent>>("/events?category=&date="),
    enabled: tab === "bookings" && Boolean(auth.account),
  });
  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => auth.request<Booking>(`/bookings/${bookingId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
  const leaveOpenPlay = useMutation({
    mutationFn: (sessionId: string) => auth.request<OpenPlaySession>(`/open-play/${sessionId}/join`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["open-play"] }),
  });
  const cancelEventRegistration = useMutation({
    mutationFn: (eventId: string) => auth.request<CommunityEvent>(`/events/${eventId}/register`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
  const discoverResults = useMemo(() => {
    const normalized = discoverQuery.trim().toLowerCase();
    if (!normalized) return facilities;
    return facilities.filter((facility) => `${facility.name} ${facility.city} ${facility.province}`.toLowerCase().includes(normalized));
  }, [discoverQuery, facilities]);
  if (tab === "discover")
    return (
      <section className="static-screen">
        <div className="mobile-page-head">
          <span className="kicker">DISCOVER</span>
          <h1>Find your next game</h1>
          <p>Browse courts, open play sessions, clubs, and events near you.</p>
        </div>
        <form className="static-search" onSubmit={(event) => event.preventDefault()}>
          <Search size={19} />
          <label className="sr-only" htmlFor="discover-court-search">Search courts</label>
          <input id="discover-court-search" value={discoverQuery} onChange={(event) => setDiscoverQuery(event.target.value)} placeholder="Search venue, city, or province" autoFocus />
          {discoverQuery && <button type="button" onClick={() => setDiscoverQuery("")} aria-label="Clear court search"><X size={17}/></button>}
        </form>
        <div className="category-grid">
          <button onClick={() => setDiscoverQuery("")}>
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
          <button onClick={() => setDiscoverQuery("")}>See all</button>
        </div>
        {discoverResults.length ? <div className="compact-list">
          {discoverResults.map((facility) => (
            <button className="compact-row" key={facility.facilityId} onClick={() => onSelectFacility(facility)} aria-label={`View ${facility.name}`}>
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
        </div> : <div className="empty compact-empty"><Search/><h3>No courts found</h3><p>Try another venue, city, or province.</p><button onClick={() => setDiscoverQuery("")}>Clear search</button></div>}
      </section>
    );

  if (tab === "bookings")
    {
      const bookings = bookingsQuery.data?.content ?? [];
      const activeBookings = bookings.filter((item) => !["CANCELLED", "EXPIRED", "COMPLETED", "NO_SHOW"].includes(item.status));
      const joinedSessions = (openPlayQuery.data?.content ?? []).filter((session) => session.joined);
      const registeredEvents = (eventsQuery.data?.content ?? []).filter((event) => event.registered);
      const paidAmount = bookings.filter((item) => item.paymentStatus === "PAID").reduce((sum, item) => sum + item.totalAmount, 0);
      return (
      <section className="static-screen player-activity-page">
        <div className="activity-head">
          <div><span className="kicker">PLAYER DASHBOARD</span><h1>My activity</h1><p>Track your court rentals, payments, and Open Play sessions in one place.</p></div>
          <button className="primary" onClick={onDiscover}><Search/> Find a court</button>
        </div>
        {auth.status === "loading" ? (
          <div className="auth-loading">Loading your account…</div>
        ) : !auth.account ? (
          <AuthPanel reason="Sign in to see your court holds and bookings." />
        ) : <>
          <div className="activity-metrics">
            <article><span className="metric-icon green"><CalendarDays/></span><div><small>UPCOMING RENTALS</small><strong>{activeBookings.length}</strong><p>Court reservations</p></div></article>
            <article><span className="metric-icon blue"><UsersRound/></span><div><small>OPEN PLAY</small><strong>{joinedSessions.length}</strong><p>Sessions joined</p></div></article>
            <article><span className="metric-icon violet"><Trophy/></span><div><small>EVENTS</small><strong>{registeredEvents.length}</strong><p>Registrations</p></div></article>
            <article><span className="metric-icon amber"><WalletCards/></span><div><small>PAID ONLINE</small><strong>{money(paidAmount)}</strong><p>Demo payments</p></div></article>
          </div>
          <div className="player-activity-grid">
            <section className="activity-panel"><header><div><span className="kicker">COURT RENTALS</span><h2>Upcoming bookings</h2></div><button onClick={onDiscover}>Book a court <ChevronRight/></button></header>
        {bookingsQuery.isLoading ? (
          <div className="empty api-state" role="status"><Clock3 /><h3>Loading bookings</h3><p>Checking your latest reservations…</p></div>
        ) : bookingsQuery.isError ? (
          <div className="empty api-state" role="alert"><CalendarDays /><h3>Bookings unavailable</h3><p>{bookingsQuery.error instanceof Error ? bookingsQuery.error.message : "Could not load your bookings."}</p><button onClick={() => bookingsQuery.refetch()}>Try again</button></div>
        ) : bookings.length ? (
          <div className="booking-list">
            {bookings.map((item) => {
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
                    <small>{item.reference} · {money(item.totalAmount, item.currencyCode)} · {item.paymentStatus === "PAID" ? "Paid" : "Pay at venue"}</small>
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
            </section>
            <section className="activity-panel open-play-activity"><header><div><span className="kicker">OPEN PLAY</span><h2>Sessions you joined</h2></div><button onClick={() => onCommunityPage("open-play")}>Find sessions <ChevronRight/></button></header>
              {openPlayQuery.isLoading ? <div className="empty activity-empty"><Clock3/><h3>Loading sessions</h3></div> : joinedSessions.length ? <div className="activity-session-list">{joinedSessions.map((session) => <article key={session.sessionId}><span className="activity-session-date"><strong>{new Date(session.startsAt).getDate()}</strong><small>{new Date(session.startsAt).toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}</small></span><div><span className="level-pill">{session.level.replaceAll("_", " ")}</span><h3>{session.venue}</h3><p><MapPin/>{session.area}</p><small>{dateLabel(session.startsAt)} · {timeLabel(session.startsAt)} · {session.players}/{session.capacity} players</small></div><button aria-label={`Leave ${session.venue}`} disabled={leaveOpenPlay.isPending} onClick={() => leaveOpenPlay.mutate(session.sessionId)}>Leave</button></article>)}</div> : <div className="empty activity-empty"><UsersRound/><h3>No joined sessions</h3><p>Join an Open Play and it will appear here.</p><button onClick={() => onCommunityPage("open-play")}>Explore Open Play</button></div>}
              {leaveOpenPlay.isError && <p className="inline-error">{leaveOpenPlay.error.message}</p>}
            </section>
            <section className="activity-panel event-activity"><header><div><span className="kicker">EVENTS</span><h2>Your event registrations</h2></div><button onClick={() => onCommunityPage("events")}>Find events <ChevronRight/></button></header>
              {eventsQuery.isLoading ? <div className="empty activity-empty"><Clock3/><h3>Loading events</h3></div> : registeredEvents.length ? <div className="activity-session-list activity-event-list">{registeredEvents.map((event) => <article key={event.eventId}><span className="activity-session-date"><strong>{new Date(event.startsAt).getDate()}</strong><small>{new Date(event.startsAt).toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}</small></span><div><span className="level-pill">{event.category}</span><h3>{event.title}</h3><p><MapPin/>{event.venue} · {event.area}</p><small>{dateLabel(event.startsAt)} · {timeLabel(event.startsAt)} · {money(event.price, event.currencyCode)}</small></div><button aria-label={`Cancel registration for ${event.title}`} disabled={cancelEventRegistration.isPending} onClick={() => cancelEventRegistration.mutate(event.eventId)}>Cancel</button></article>)}</div> : <div className="empty activity-empty"><Trophy/><h3>No event registrations</h3><p>Register for an event and it will appear here.</p><button onClick={() => onCommunityPage("events")}>Explore events</button></div>}
              {cancelEventRegistration.isError && <p className="inline-error">{cancelEventRegistration.error.message}</p>}
            </section>
          </div>
        </>}
      </section>
    );
    }

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
