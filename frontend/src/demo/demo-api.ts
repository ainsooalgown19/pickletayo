import { ApiError } from "@/lib/api/client";
import type { AdminBooking, AvailabilitySlot, Club, CommunityEvent, FacilitySummary, OpenPlaySession, Page } from "@/lib/api/contracts";
import { currentUserDetails } from "@/stores/current-user";
import { demoAccounts, initialDemoState, playerBooking, type DemoState } from "./demo-data";

export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const storageKey = "pickletayo-demo-data-v2";

function load(): DemoState {
  if (typeof window === "undefined") return initialDemoState();
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return initialDemoState();
  try { return JSON.parse(saved) as DemoState; } catch { return initialDemoState(); }
}

function save(state: DemoState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function resetDemoData() {
  if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
}

function page<T>(content: T[]): Page<T> {
  return { content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 100 };
}

function summary(facility: DemoState["facilities"][number]): FacilitySummary {
  const active = facility.courts.filter((court) => court.status === "ACTIVE");
  return {
    facilityId: facility.facilityId, name: facility.name, status: facility.status,
    city: facility.location.city, province: facility.location.province,
    latitude: facility.location.latitude, longitude: facility.location.longitude,
    activeCourts: active.length,
    startingHourlyRate: Math.min(...active.map((court) => court.baseHourlyRate)), currencyCode: "PHP",
  };
}

function body(init?: RequestInit): Record<string, unknown> {
  if (!init?.body || typeof init.body !== "string") return {};
  return JSON.parse(init.body) as Record<string, unknown>;
}

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function demoRequest<T>(rawPath: string, init?: RequestInit): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const state = load();
  const method = init?.method?.toUpperCase() ?? "GET";
  const url = new URL(rawPath, window.location.origin);
  const path = url.pathname;
  const signedInAccount = currentUserDetails();
  const account = signedInAccount ?? demoAccounts.PLAYER;

  if (path === "/account/me" && method === "GET") return account as T;
  if (path === "/account/me" && method === "PATCH") return { ...account, ...body(init) } as T;
  if (path === "/account/sessions") return (method === "DELETE" ? undefined : [{ sessionId: "demo-session", createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86_400_000).toISOString(), current: true, revoked: false, userAgent: "Demo browser" }]) as T;
  if (path.startsWith("/account/sessions/") && method === "DELETE") return undefined as T;
  if (path === "/account/notification-preferences") {
    if (method === "PUT") { state.notificationPreferences = body(init) as DemoState["notificationPreferences"]; save(state); }
    return state.notificationPreferences as T;
  }

  if (path === "/facilities" && method === "GET") {
    const query = url.searchParams.get("query")?.toLowerCase() ?? "";
    const city = url.searchParams.get("city")?.toLowerCase() ?? "";
    const courtType = url.searchParams.get("courtType") ?? "";
    const items = state.facilities.filter((facility) => facility.status === "ACTIVE")
      .filter((facility) => !query || `${facility.name} ${facility.location.city} ${facility.location.barangay}`.toLowerCase().includes(query))
      .filter((facility) => !city || facility.location.city.toLowerCase().includes(city))
      .filter((facility) => !courtType || facility.courts.some((court) => court.type === courtType))
      .map(summary);
    return page(items) as T;
  }

  const availability = path.match(/^\/facilities\/([^/]+)\/availability$/);
  if (availability && method === "GET") {
    const facility = state.facilities.find((item) => item.facilityId === availability[1]);
    if (!facility) throw new ApiError(404, "Demo facility not found.");
    const date = url.searchParams.get("date") ?? new Date().toLocaleDateString("en-CA");
    const slots: AvailabilitySlot[] = facility.courts.flatMap((court, courtIndex) => [9, 11, 14, 17, 19].map((hour) => {
      const start = new Date(`${date}T${String(hour + courtIndex).padStart(2, "0")}:00:00+08:00`);
      const end = new Date(start.getTime() + 3_600_000);
      return { courtId: court.courtId, courtName: court.name, startsAt: start.toISOString(), endsAt: end.toISOString(), price: court.baseHourlyRate, currencyCode: court.currencyCode };
    })).filter((slot) => !state.bookings.some((booking) => booking.courtId === slot.courtId && booking.status !== "CANCELLED" && booking.startsAt === slot.startsAt));
    return { facilityId: facility.facilityId, date, timezone: facility.timezone, durationMinutes: 60, slots } as T;
  }

  const facilityDetail = path.match(/^\/facilities\/([^/]+)$/);
  if (facilityDetail && method === "GET") {
    const facility = state.facilities.find((item) => item.facilityId === facilityDetail[1]);
    if (!facility) throw new ApiError(404, "Demo facility not found.");
    return facility as T;
  }

  if (path === "/bookings/holds" && method === "POST") {
    const input = body(init);
    const facility = state.facilities.find((item) => item.courts.some((court) => court.courtId === input.courtId));
    const court = facility?.courts.find((item) => item.courtId === input.courtId);
    if (!facility || !court) throw new ApiError(404, "Court not found.");
    const created: AdminBooking = {
      bookingId: makeId("booking"), reference: `PT-${Math.floor(100000 + Math.random() * 900000)}`,
      facilityId: facility.facilityId, courtId: court.courtId, facilityName: facility.name, courtName: court.name,
      playerId: account.userId, playerName: `${account.givenName} ${account.familyName}`.trim(), startsAt: String(input.startsAt), endsAt: String(input.endsAt),
      status: "CONFIRMED", subtotalAmount: court.baseHourlyRate, discountAmount: 0, totalAmount: court.baseHourlyRate, currencyCode: "PHP", paymentStatus: input.paymentMethod === "PAY_AT_VENUE" ? "UNPAID" : "PAID",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    state.bookings.unshift(created); save(state); return playerBooking(created) as T;
  }

  if (path === "/bookings" && method === "GET") return page(state.bookings.filter((booking) => booking.playerId === account.userId).map(playerBooking)) as T;
  const playerBookingPath = path.match(/^\/bookings\/([^/]+)$/);
  if (playerBookingPath && method === "DELETE") {
    const booking = state.bookings.find((item) => item.bookingId === playerBookingPath[1] && item.playerId === account.userId);
    if (!booking) throw new ApiError(404, "Booking not found.");
    booking.status = "CANCELLED"; booking.updatedAt = new Date().toISOString(); save(state); return playerBooking(booking) as T;
  }

  const openPlaySession = (session: DemoState["openPlaySessions"][number]): OpenPlaySession => ({
    sessionId: session.sessionId, venue: session.venue, area: session.area, startsAt: session.startsAt, level: session.level,
    players: session.players, capacity: session.capacity, spotsRemaining: Math.max(0, session.capacity - session.players), joined: Boolean(signedInAccount && session.joinedUserIds.includes(signedInAccount.userId)),
  });
  if (path === "/open-play" && method === "GET") {
    const range = url.searchParams.get("range") ?? "TODAY";
    const level = url.searchParams.get("level") ?? "";
    const dateKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const items = state.openPlaySessions.filter((session) => {
      const date = new Date(session.startsAt); const key = dateKey(date);
      const inRange = range === "TODAY" ? key === dateKey(today) : range === "TOMORROW" ? key === dateKey(tomorrow) : date >= today && date <= weekEnd;
      return inRange && (!level || session.level === level);
    }).map(openPlaySession);
    return page(items) as T;
  }
  if (path === "/open-play" && method === "POST") {
    const input = body(init); const created = {
      sessionId: makeId("open"), venue: String(input.venue), area: String(input.area), startsAt: String(input.startsAt),
      level: String(input.level) as OpenPlaySession["level"], players: 1, capacity: Number(input.capacity), joinedUserIds: [account.userId],
    };
    state.openPlaySessions.unshift(created); save(state); return openPlaySession(created) as T;
  }
  const openPlayJoin = path.match(/^\/open-play\/([^/]+)\/join$/);
  if (openPlayJoin && (method === "POST" || method === "DELETE")) {
    const session = state.openPlaySessions.find((item) => item.sessionId === openPlayJoin[1]);
    if (!session) throw new ApiError(404, "Open play session not found.");
    const joined = session.joinedUserIds.includes(account.userId);
    if (method === "POST" && !joined) {
      if (session.players >= session.capacity) throw new ApiError(409, "This session is already full.");
      session.joinedUserIds.push(account.userId); session.players += 1;
    }
    if (method === "DELETE" && joined) { session.joinedUserIds = session.joinedUserIds.filter((id) => id !== account.userId); session.players = Math.max(0, session.players - 1); }
    save(state); return openPlaySession(session) as T;
  }

  const eventView = (event: DemoState["events"][number]): CommunityEvent => ({
    eventId: event.eventId, title: event.title, venue: event.venue, area: event.area, startsAt: event.startsAt, endsAt: event.endsAt,
    category: event.category, format: event.format, level: event.level, description: event.description, price: event.price,
    currencyCode: event.currencyCode, registrations: event.registrations, capacity: event.capacity,
    spotsRemaining: Math.max(0, event.capacity - event.registrations), registered: Boolean(signedInAccount && event.registeredUserIds.includes(signedInAccount.userId)), createdAt: event.createdAt,
  });
  if (path === "/events" && method === "GET") {
    const category = url.searchParams.get("category") ?? ""; const date = url.searchParams.get("date") ?? "";
    const dateKey = (value: string) => new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const items = state.events.filter((event) => !category || event.category === category).filter((event) => !date || dateKey(event.startsAt) === date).sort((left, right) => left.startsAt.localeCompare(right.startsAt));
    return page(items.map(eventView)) as T;
  }
  if (path === "/events" && method === "POST") {
    const input = body(init); const created = {
      eventId: makeId("event"), title: String(input.title), venue: String(input.venue), area: String(input.area), startsAt: String(input.startsAt), endsAt: String(input.endsAt),
      category: String(input.category) as CommunityEvent["category"], format: String(input.format), level: String(input.level) as CommunityEvent["level"], description: String(input.description),
      price: Number(input.price), currencyCode: "PHP", registrations: 1, capacity: Number(input.capacity), createdAt: new Date().toISOString(), registeredUserIds: [account.userId],
    };
    state.events.unshift(created); save(state); return eventView(created) as T;
  }
  const eventRegistration = path.match(/^\/events\/([^/]+)\/register$/);
  if (eventRegistration && (method === "POST" || method === "DELETE")) {
    const event = state.events.find((item) => item.eventId === eventRegistration[1]);
    if (!event) throw new ApiError(404, "Event not found.");
    const registered = event.registeredUserIds.includes(account.userId);
    if (method === "POST" && !registered) {
      if (event.registrations >= event.capacity) throw new ApiError(409, "Registration for this event is full.");
      event.registeredUserIds.push(account.userId); event.registrations += 1;
    }
    if (method === "DELETE" && registered) { event.registeredUserIds = event.registeredUserIds.filter((id) => id !== account.userId); event.registrations = Math.max(0, event.registrations - 1); }
    save(state); return eventView(event) as T;
  }

  const clubView = (club: DemoState["clubs"][number]): Club => ({
    clubId: club.clubId, initials: club.initials, name: club.name, area: club.area, members: club.members, schedule: club.schedule,
    description: club.description, verified: club.verified, createdAt: club.createdAt, joined: Boolean(signedInAccount && club.joinedUserIds.includes(signedInAccount.userId)),
  });
  if (path === "/clubs" && method === "GET") {
    const sort = url.searchParams.get("sort") ?? "NEARBY"; const area = url.searchParams.get("area") ?? "";
    const items = state.clubs.filter((club) => !area || club.area === area).sort((left, right) => sort === "ACTIVE" ? right.members - left.members : sort === "NEW" ? right.createdAt.localeCompare(left.createdAt) : left.name.localeCompare(right.name));
    return page(items.map(clubView)) as T;
  }
  if (path === "/clubs" && method === "POST") {
    const input = body(init); const words = String(input.name).trim().split(/\s+/);
    const created = { clubId: makeId("club"), initials: words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join(""), name: String(input.name), area: String(input.area), members: 1, schedule: String(input.schedule), description: String(input.description), verified: false, createdAt: new Date().toISOString(), joinedUserIds: [account.userId] };
    state.clubs.unshift(created); save(state); return clubView(created) as T;
  }
  const clubJoin = path.match(/^\/clubs\/([^/]+)\/join$/);
  if (clubJoin && (method === "POST" || method === "DELETE")) {
    const club = state.clubs.find((item) => item.clubId === clubJoin[1]);
    if (!club) throw new ApiError(404, "Club not found.");
    const joined = club.joinedUserIds.includes(account.userId);
    if (method === "POST" && !joined) { club.joinedUserIds.push(account.userId); club.members += 1; }
    if (method === "DELETE" && joined) { club.joinedUserIds = club.joinedUserIds.filter((id) => id !== account.userId); club.members = Math.max(0, club.members - 1); }
    save(state); return clubView(club) as T;
  }

  if ((path === "/organizations" || path === "/organizations/mine") && method === "GET") {
    const items = path.endsWith("/mine") ? state.organizations.filter((item) => item.ownerUserId === account.userId) : state.organizations;
    return page(items) as T;
  }
  if (path === "/organizations" && method === "POST") {
    const input = body(init);
    const organization = { organizationId: makeId("org"), type: String(input.type) as "CLUB" | "COURT_OPERATOR", legalName: String(input.legalName), displayName: String(input.displayName), status: "ACTIVE" as const, ownerUserId: account.userId, createdAt: new Date().toISOString() };
    state.organizations.unshift(organization); save(state); return organization as T;
  }
  const organizationFacilities = path.match(/^\/organizations\/([^/]+)\/facilities$/);
  if (organizationFacilities && method === "GET") return page(state.facilities.filter((item) => item.organizationId === organizationFacilities[1]).map(summary)) as T;
  if (organizationFacilities && method === "POST") {
    const input = body(init); const location = input.location as DemoState["facilities"][number]["location"];
    const facility: DemoState["facilities"][number] = { facilityId: makeId("facility"), organizationId: organizationFacilities[1], name: String(input.name), branchCode: String(input.branchCode), description: String(input.description ?? ""), status: "DRAFT", contactNumber: String(input.contactNumber ?? ""), contactEmail: String(input.contactEmail ?? ""), timezone: "Asia/Manila", location: { ...location, countryCode: "PH", verified: false }, courts: [], createdAt: new Date().toISOString() };
    state.facilities.unshift(facility); save(state); return facility as T;
  }

  const addCourt = path.match(/^\/facilities\/([^/]+)\/courts$/);
  if (addCourt && method === "POST") {
    const facility = state.facilities.find((item) => item.facilityId === addCourt[1]); const input = body(init);
    if (!facility) throw new ApiError(404, "Facility not found.");
    const court = { courtId: makeId("court"), code: String(input.code), name: String(input.name), type: String(input.type) as "INDOOR" | "OUTDOOR" | "COVERED", surfaceType: String(input.surfaceType), status: "ACTIVE" as const, lighting: Boolean(input.lighting), baseHourlyRate: Number(input.baseHourlyRate), currencyCode: "PHP" };
    facility.courts.push(court); save(state); return court as T;
  }
  const statusPath = path.match(/^\/facilities\/([^/]+)\/status$/);
  if (statusPath && method === "PATCH") {
    const facility = state.facilities.find((item) => item.facilityId === statusPath[1]);
    if (!facility) throw new ApiError(404, "Facility not found.");
    facility.status = String(body(init).status) as typeof facility.status; save(state); return facility as T;
  }
  if (/^\/facilities\/[^/]+\/operating-hours$/.test(path) || /^\/courts\/[^/]+\/(rate-rules|availability-blocks)$/.test(path)) return { saved: true } as T;

  if (path === "/admin/bookings" && method === "GET") {
    const query = url.searchParams.get("query")?.toLowerCase() ?? ""; const status = url.searchParams.get("status") ?? "";
    return page(state.bookings.filter((booking) => !status || booking.status === status).filter((booking) => !query || `${booking.reference} ${booking.playerName} ${booking.facilityName} ${booking.courtName}`.toLowerCase().includes(query))) as T;
  }
  const adminTransition = path.match(/^\/admin\/bookings\/([^/]+)\/(cancel|check-in)$/);
  if (adminTransition && method === "POST") {
    const booking = state.bookings.find((item) => item.bookingId === adminTransition[1]);
    if (!booking) throw new ApiError(404, "Booking not found.");
    booking.status = adminTransition[2] === "cancel" ? "CANCELLED" : "CHECKED_IN"; booking.updatedAt = new Date().toISOString(); save(state); return booking as T;
  }

  throw new ApiError(501, `This action is not available in demo mode: ${method} ${path}`);
}
