import type { Account } from "@/modules/identity/domain/account";
import type { AdminBooking, Booking, Club, CommunityEvent, Court, FacilityDetail, OpenPlaySession, Organization } from "@/lib/api/contracts";

export type DemoRole = "GUEST" | "PLAYER" | "OPERATOR" | "ADMIN";

export const demoAccounts: Record<Exclude<DemoRole, "GUEST">, Account> = {
  PLAYER: {
    userId: "11111111-1111-1111-1111-111111111111",
    email: "player@pickletayo.test",
    emailVerified: true,
    givenName: "Mika",
    familyName: "Santos",
    status: "ACTIVE",
    roles: ["PLAYER"],
    createdAt: "2026-08-15T00:00:00.000Z",
  },
  OPERATOR: {
    userId: "22222222-2222-2222-2222-222222222222",
    email: "operator@pickletayo.test",
    emailVerified: true,
    givenName: "Paolo",
    familyName: "Reyes",
    status: "ACTIVE",
    roles: ["PLAYER", "COURT_OWNER"],
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  ADMIN: {
    userId: "33333333-3333-3333-3333-333333333333",
    email: "admin@pickletayo.test",
    emailVerified: true,
    givenName: "System",
    familyName: "Administrator",
    status: "ACTIVE",
    roles: ["PLAYER", "PLATFORM_ADMIN"],
    createdAt: "2026-06-01T00:00:00.000Z",
  },
};

export const demoOrganizations: Organization[] = [
  {
    organizationId: "org-rally-point",
    type: "COURT_OPERATOR",
    legalName: "Rally Point Sports Inc.",
    displayName: "Rally Point Courts",
    status: "ACTIVE",
    ownerUserId: demoAccounts.OPERATOR.userId,
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  {
    organizationId: "org-metro-pickle",
    type: "CLUB",
    legalName: "Metro Pickle Club Association",
    displayName: "Metro Pickle Club",
    status: "ACTIVE",
    ownerUserId: demoAccounts.ADMIN.userId,
    createdAt: "2026-07-12T00:00:00.000Z",
  },
];

const courts: Record<string, Court[]> = {
  "facility-riverside": [
    { courtId: "court-riverside-1", code: "R1", name: "Riverside One", type: "INDOOR", surfaceType: "Acrylic", status: "ACTIVE", lighting: true, baseHourlyRate: 850, currencyCode: "PHP" },
    { courtId: "court-riverside-2", code: "R2", name: "Riverside Two", type: "INDOOR", surfaceType: "Acrylic", status: "ACTIVE", lighting: true, baseHourlyRate: 850, currencyCode: "PHP" },
  ],
  "facility-skyline": [
    { courtId: "court-skyline-1", code: "S1", name: "Sky Court", type: "OUTDOOR", surfaceType: "Sport tile", status: "ACTIVE", lighting: true, baseHourlyRate: 1100, currencyCode: "PHP" },
    { courtId: "court-skyline-2", code: "S2", name: "Sunset Court", type: "OUTDOOR", surfaceType: "Sport tile", status: "ACTIVE", lighting: true, baseHourlyRate: 1250, currencyCode: "PHP" },
  ],
  "facility-garden": [
    { courtId: "court-garden-1", code: "G1", name: "Garden Court", type: "COVERED", surfaceType: "Concrete", status: "ACTIVE", lighting: true, baseHourlyRate: 700, currencyCode: "PHP" },
  ],
};

export const demoFacilities: FacilityDetail[] = [
  {
    facilityId: "facility-riverside", organizationId: "org-rally-point", name: "Riverside Indoor Courts", branchCode: "RIV-QC",
    description: "Two bright indoor courts with player lounges and equipment rental.", status: "ACTIVE", contactNumber: "+63 917 555 0101", contactEmail: "riverside@pickletayo.test", timezone: "Asia/Manila",
    location: { addressLine1: "18 Riverside Drive", barangay: "Bagumbayan", city: "Quezon City", province: "Metro Manila", postalCode: "1110", countryCode: "PH", latitude: 14.6101, longitude: 121.0789, directionsLandmark: "Beside the community center", verified: true },
    courts: courts["facility-riverside"], createdAt: "2026-07-03T00:00:00.000Z",
  },
  {
    facilityId: "facility-skyline", organizationId: "org-rally-point", name: "Skyline Rooftop Pickleball", branchCode: "SKY-BGC",
    description: "Rooftop courts with evening city views and covered rest areas.", status: "ACTIVE", contactNumber: "+63 917 555 0102", contactEmail: "skyline@pickletayo.test", timezone: "Asia/Manila",
    location: { addressLine1: "9th Avenue", barangay: "Fort Bonifacio", city: "Taguig", province: "Metro Manila", postalCode: "1634", countryCode: "PH", latitude: 14.5508, longitude: 121.0511, directionsLandmark: "Roof deck of Active Tower", verified: true },
    courts: courts["facility-skyline"], createdAt: "2026-07-08T00:00:00.000Z",
  },
  {
    facilityId: "facility-garden", organizationId: "org-metro-pickle", name: "Garden City Pickle Courts", branchCode: "GDN-MKT",
    description: "A friendly covered neighborhood court for casual and competitive play.", status: "ACTIVE", contactNumber: "+63 917 555 0103", contactEmail: "garden@pickletayo.test", timezone: "Asia/Manila",
    location: { addressLine1: "42 Garden Lane", barangay: "San Lorenzo", city: "Makati", province: "Metro Manila", postalCode: "1223", countryCode: "PH", latitude: 14.5532, longitude: 121.0214, directionsLandmark: "Across from the weekend market", verified: true },
    courts: courts["facility-garden"], createdAt: "2026-07-15T00:00:00.000Z",
  },
];

function futureDate(daysAhead: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const demoBookings: AdminBooking[] = [
  {
    bookingId: "booking-demo-player", reference: "PT-DEMO-101", facilityId: "facility-riverside", courtId: "court-riverside-1",
    facilityName: "Riverside Indoor Courts", courtName: "Riverside One", playerId: demoAccounts.PLAYER.userId, playerName: "Mika Santos",
    startsAt: futureDate(2, 18), endsAt: futureDate(2, 19), status: "CONFIRMED", subtotalAmount: 850, discountAmount: 0, totalAmount: 850,
    currencyCode: "PHP", paymentStatus: "UNPAID", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    bookingId: "booking-demo-guest", reference: "PT-DEMO-102", facilityId: "facility-skyline", courtId: "court-skyline-1",
    facilityName: "Skyline Rooftop Pickleball", courtName: "Sky Court", playerId: "44444444-4444-4444-4444-444444444444", playerName: "Andrea Lim",
    startsAt: futureDate(1, 17), endsAt: futureDate(1, 18), status: "CONFIRMED", subtotalAmount: 1100, discountAmount: 0, totalAmount: 1100,
    currencyCode: "PHP", paymentStatus: "UNPAID", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export type DemoState = {
  organizations: Organization[];
  facilities: FacilityDetail[];
  bookings: AdminBooking[];
  openPlaySessions: Array<Omit<OpenPlaySession, "spotsRemaining" | "joined"> & { joinedUserIds: string[] }>;
  events: Array<Omit<CommunityEvent, "spotsRemaining" | "registered"> & { registeredUserIds: string[] }>;
  clubs: Array<Omit<Club, "joined"> & { joinedUserIds: string[] }>;
  notificationPreferences: { bookingUpdates: boolean; accountSecurity: boolean; productNews: boolean };
};

export function initialDemoState(): DemoState {
  const sessionTime = (daysAhead: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    date.setHours(hour, 30, 0, 0);
    return date.toISOString();
  };
  return JSON.parse(JSON.stringify({
    organizations: demoOrganizations,
    facilities: demoFacilities,
    bookings: demoBookings,
    openPlaySessions: [
      { sessionId: "open-marina", venue: "Marina Courts", area: "BGC, Taguig", startsAt: sessionTime(0, 20), level: "BEGINNER", players: 9, capacity: 12, joinedUserIds: [] },
      { sessionId: "open-riverside", venue: "Riverside Indoor Courts", area: "Quezon City", startsAt: sessionTime(1, 18), level: "INTERMEDIATE", players: 7, capacity: 12, joinedUserIds: [] },
      { sessionId: "open-skyline", venue: "Skyline Rooftop Pickleball", area: "Taguig", startsAt: sessionTime(3, 19), level: "ALL_LEVELS", players: 6, capacity: 12, joinedUserIds: [] },
    ],
    events: [
      { eventId: "event-social-mixer", title: "Saturday Social Mixer", venue: "Riverside Indoor Courts", area: "Quezon City", startsAt: sessionTime(2, 9), endsAt: sessionTime(2, 13), category: "SOCIAL", format: "Doubles mixer", level: "ALL_LEVELS", description: "A relaxed morning mixer with rotating partners, friendly games, and a welcome briefing for first-time event players.", price: 450, currencyCode: "PHP", registrations: 34, capacity: 48, createdAt: new Date().toISOString(), registeredUserIds: [] },
      { eventId: "event-sunset-rally", title: "Sunset Rally Series", venue: "Skyline Rooftop Pickleball", area: "Makati", startsAt: sessionTime(4, 16), endsAt: sessionTime(4, 21), category: "TOURNAMENT", format: "Round robin", level: "INTERMEDIATE", description: "A rooftop round robin for intermediate players, followed by knockout matches under the city lights.", price: 650, currencyCode: "PHP", registrations: 42, capacity: 48, createdAt: new Date().toISOString(), registeredUserIds: [] },
      { eventId: "event-rookies-cup", title: "Rookies Cup", venue: "Marina Courts", area: "Taguig", startsAt: sessionTime(6, 8), endsAt: sessionTime(6, 15), category: "TOURNAMENT", format: "Beginner doubles", level: "BEGINNER", description: "A beginner-friendly doubles competition with guaranteed group matches and a simple introduction to tournament play.", price: 800, currencyCode: "PHP", registrations: 22, capacity: 32, createdAt: new Date().toISOString(), registeredUserIds: [] },
    ],
    clubs: [
      { clubId: "club-qc", initials: "QC", name: "QC Pickle Crew", area: "Quezon City", members: 284, schedule: "Plays Tue, Thu & Sat", description: "A welcoming Quezon City community for social rallies and competitive games.", verified: true, createdAt: "2026-05-10T00:00:00.000Z", joinedUserIds: [] },
      { clubId: "club-makati", initials: "MK", name: "Makati Kitchen", area: "Makati", members: 176, schedule: "Weeknight open play", description: "After-work pickleball for Makati players of every skill level.", verified: true, createdAt: "2026-07-18T00:00:00.000Z", joinedUserIds: [] },
      { clubId: "club-southside", initials: "SP", name: "Southside Picklers", area: "Alabang", members: 143, schedule: "Weekend socials", description: "Weekend games, beginner clinics, and friendly tournaments in the south.", verified: false, createdAt: "2026-09-05T00:00:00.000Z", joinedUserIds: [] },
    ],
    notificationPreferences: { bookingUpdates: true, accountSecurity: true, productNews: false },
  })) as DemoState;
}

export function playerBooking(booking: AdminBooking): Booking {
  const { facilityName: _facilityName, courtName: _courtName, playerId: _playerId, playerName: _playerName, updatedAt: _updatedAt, ...result } = booking;
  return result;
}
