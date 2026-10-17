export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type Organization = {
  organizationId: string;
  type: "CLUB" | "COURT_OPERATOR" | "PLATFORM";
  legalName: string;
  displayName: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  ownerUserId: string;
  createdAt: string;
};

export type FacilitySummary = {
  facilityId: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "TEMPORARILY_CLOSED" | "CLOSED";
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  activeCourts: number;
  startingHourlyRate: number;
  currencyCode: string;
};

export type Court = {
  courtId: string;
  code: string;
  name: string;
  type: "INDOOR" | "OUTDOOR" | "COVERED";
  surfaceType: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  lighting: boolean;
  baseHourlyRate: number;
  currencyCode: string;
};

export type FacilityDetail = {
  facilityId: string;
  organizationId: string;
  name: string;
  branchCode: string;
  description?: string;
  status: FacilitySummary["status"];
  contactNumber?: string;
  contactEmail?: string;
  timezone: string;
  location: {
    addressLine1: string;
    addressLine2?: string;
    barangay?: string;
    city: string;
    province: string;
    postalCode?: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    directionsLandmark?: string;
    verified: boolean;
  };
  courts: Court[];
  createdAt: string;
};

export type AvailabilitySlot = {
  courtId: string;
  courtName: string;
  startsAt: string;
  endsAt: string;
  price: number;
  currencyCode: string;
};

export type FacilityAvailability = {
  facilityId: string;
  date: string;
  timezone: string;
  durationMinutes: number;
  slots: AvailabilitySlot[];
};

export type Booking = {
  bookingId: string;
  reference: string;
  facilityId: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  status: "HOLD" | "PENDING_PAYMENT" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "EXPIRED";
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";
  holdExpiresAt?: string;
  createdAt: string;
};

export type AdminBooking = Booking & {
  facilityName: string;
  courtName: string;
  playerId: string;
  playerName: string;
  updatedAt: string;
};

export type OpenPlaySession = {
  sessionId: string;
  venue: string;
  area: string;
  startsAt: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ALL_LEVELS";
  players: number;
  capacity: number;
  spotsRemaining: number;
  joined: boolean;
};

export type Club = {
  clubId: string;
  initials: string;
  name: string;
  area: string;
  members: number;
  schedule: string;
  description: string;
  verified: boolean;
  joined: boolean;
  createdAt: string;
};

export type CommunityEvent = {
  eventId: string;
  title: string;
  venue: string;
  area: string;
  startsAt: string;
  endsAt: string;
  category: "SOCIAL" | "TOURNAMENT";
  format: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ALL_LEVELS";
  description: string;
  price: number;
  currencyCode: string;
  registrations: number;
  capacity: number;
  spotsRemaining: number;
  registered: boolean;
  createdAt: string;
};

export function money(amount: number, currencyCode = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function localDate(daysAhead = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}
