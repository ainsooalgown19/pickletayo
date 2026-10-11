import type { AvailabilitySlot } from "@/lib/api/contracts";

export type AvailabilityPeriod = { startsAt: Date; endsAt: Date };
export type AvailabilityRateRule = {
  dayOfWeek: number | null;
  startsAtMinutes: number | null;
  endsAtMinutes: number | null;
  hourlyRate: number;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  priority: number;
};
export type AvailabilityCourt = {
  courtId: string;
  courtName: string;
  baseHourlyRate: number;
  currencyCode: string;
  rateRules: AvailabilityRateRule[];
  blocks: AvailabilityPeriod[];
  reservations: AvailabilityPeriod[];
};

type GenerateAvailabilityInput = {
  date: string;
  timezone: string;
  durationMinutes: number;
  opensAtMinutes: number;
  closesAtMinutes: number;
  now: Date;
  courts: AvailabilityCourt[];
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string) {
  let value = formatterCache.get(timezone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatterCache.set(timezone, value);
  }
  return value;
}

function timezoneParts(instant: Date, timezone: string) {
  const values: Record<string, number> = {};
  for (const part of formatter(timezone).formatToParts(instant)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return values;
}

function timezoneOffsetMillis(instant: Date, timezone: string) {
  const values = timezoneParts(instant, timezone);
  const representedAsUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
  return representedAsUtc - instant.getTime();
}

export function localDateTimeAt(instant: Date, timezone: string) {
  const values = timezoneParts(instant, timezone);
  const date = `${String(values.year).padStart(4, "0")}-${String(values.month).padStart(2, "0")}-${String(values.day).padStart(2, "0")}`;
  return { date, minutes: values.hour * 60 + values.minute, dayOfWeek: isoDayOfWeek(date) };
}

export function zonedDateTimeToInstant(date: string, minutes: number, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0);
  let result = new Date(localAsUtc);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = new Date(localAsUtc - timezoneOffsetMillis(result, timezone));
  }
  return result;
}

export function isoDatePlusDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isoDayOfWeek(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;
}

function overlaps(period: AvailabilityPeriod, startsAt: Date, endsAt: Date) {
  return period.startsAt < endsAt && period.endsAt > startsAt;
}

function rateFor(court: AvailabilityCourt, date: string, dayOfWeek: number, startsAtMinutes: number) {
  const rule = [...court.rateRules]
    .sort((left, right) => right.priority - left.priority)
    .find((candidate) =>
      (candidate.dayOfWeek === null || candidate.dayOfWeek === dayOfWeek)
      && (candidate.effectiveFrom === null || candidate.effectiveFrom <= date)
      && (candidate.effectiveUntil === null || candidate.effectiveUntil >= date)
      && (candidate.startsAtMinutes === null || candidate.startsAtMinutes <= startsAtMinutes)
      && (candidate.endsAtMinutes === null || candidate.endsAtMinutes > startsAtMinutes));
  return rule?.hourlyRate ?? court.baseHourlyRate;
}

export function generateAvailability(input: GenerateAvailabilityInput): AvailabilitySlot[] {
  const dayOfWeek = isoDayOfWeek(input.date);
  const result: AvailabilitySlot[] = [];

  for (const court of input.courts) {
    for (let minutes = input.opensAtMinutes; minutes + input.durationMinutes <= input.closesAtMinutes; minutes += 30) {
      const startsAt = zonedDateTimeToInstant(input.date, minutes, input.timezone);
      const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);
      if (startsAt <= input.now) continue;
      if (court.blocks.some((period) => overlaps(period, startsAt, endsAt))) continue;
      if (court.reservations.some((period) => overlaps(period, startsAt, endsAt))) continue;
      const hourlyRate = rateFor(court, input.date, dayOfWeek, minutes);
      result.push({
        courtId: court.courtId,
        courtName: court.courtName,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        price: Math.round(hourlyRate * input.durationMinutes / 60 * 100) / 100,
        currencyCode: court.currencyCode,
      });
    }
  }

  return result.sort((left, right) => left.startsAt.localeCompare(right.startsAt) || left.courtName.localeCompare(right.courtName));
}
