import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Account } from "@/modules/identity/domain/account";
import type { Court, FacilityAvailability, FacilityDetail, FacilitySummary, Page } from "@/lib/api/contracts";
import { ApplicationError } from "@/lib/api/route-errors";
import { getPrismaClient } from "@/lib/prisma";
import type { z } from "zod";
import type { availabilityBlockSchema, createCourtSchema, createFacilitySchema, facilityStatusSchema, operatingHoursSchema, rateRuleSchema } from "../api/schemas";
import { generateAvailability, isoDatePlusDays, isoDayOfWeek, zonedDateTimeToInstant } from "./availability-engine";

type CreateFacility = z.infer<typeof createFacilitySchema>;
type CreateCourt = z.infer<typeof createCourtSchema>;
type Hours = z.infer<typeof operatingHoursSchema>;
type RateRule = z.infer<typeof rateRuleSchema>;
type AvailabilityBlock = z.infer<typeof availabilityBlockSchema>;
type Status = z.infer<typeof facilityStatusSchema>["status"];

const detailInclude = {
  location: true,
  courts: { orderBy: { name: "asc" as const } },
} satisfies Prisma.FacilityInclude;

type FacilityDetailRow = Prisma.FacilityGetPayload<{ include: typeof detailInclude }>;

function optional(value: string) { return value || null; }
function time(value: string | null) { return value ? new Date(`1970-01-01T${value}:00.000Z`) : null; }
function date(value: string | null) { return value ? new Date(`${value}T00:00:00.000Z`) : null; }
function timeMinutes(value: Date | null) { return value ? value.getUTCHours() * 60 + value.getUTCMinutes() : null; }
function dateOnly(value: Date | null) { return value ? value.toISOString().slice(0, 10) : null; }
function courtDto(row: { id: string; code: string; name: string; type: string; surfaceType: string; status: string; lighting: boolean; baseHourlyRate: { toNumber(): number }; currencyCode: string }): Court {
  return { courtId: row.id, code: row.code, name: row.name, type: row.type as Court["type"], surfaceType: row.surfaceType, status: row.status as Court["status"], lighting: row.lighting, baseHourlyRate: row.baseHourlyRate.toNumber(), currencyCode: row.currencyCode.trim() };
}

export class FacilityService {
  private readonly prisma = getPrismaClient();

  async listPublic(query: { search?: string; city?: string; courtType?: string; page: number; size: number }): Promise<Page<FacilitySummary>> {
    const where = {
      status: "ACTIVE",
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
      ...(query.city ? { location: { city: { contains: query.city, mode: "insensitive" as const } } } : {}),
      ...(query.courtType ? { courts: { some: { type: query.courtType, status: "ACTIVE" } } } : {}),
    };
    return this.list(where, query.page, query.size);
  }

  async listForOrganization(account: Account, organizationId: string, page: number, size: number) {
    await this.assertCanManage(account, organizationId);
    return this.list({ organizationId }, page, size);
  }

  async getDetail(facilityId: string, account?: Account | null): Promise<FacilityDetail> {
    const row = await this.prisma.facility.findUnique({ where: { id: facilityId }, include: detailInclude });
    if (!row) throw new ApplicationError(404, "FACILITY_NOT_FOUND", "Facility not found.");
    if (row.status !== "ACTIVE") {
      if (!account) throw new ApplicationError(404, "FACILITY_NOT_FOUND", "Facility not found.");
      await this.assertCanManage(account, row.organizationId);
    }
    return this.detailDto(row);
  }

  async create(account: Account, organizationId: string, input: CreateFacility): Promise<FacilityDetail> {
    await this.assertCanManage(account, organizationId);
    const row = await this.prisma.facility.create({
      data: {
        organizationId, name: input.name, branchCode: input.branchCode, description: optional(input.description), status: "DRAFT",
        contactNumber: optional(input.contactNumber), contactEmail: optional(input.contactEmail), timezone: input.timezone,
        location: { create: { addressLine1: input.location.addressLine1, addressLine2: optional(input.location.addressLine2), barangay: optional(input.location.barangay), city: input.location.city, province: input.location.province, postalCode: optional(input.location.postalCode), countryCode: "PH", latitude: input.location.latitude, longitude: input.location.longitude, directionsLandmark: optional(input.location.directionsLandmark), verified: false } },
      },
      include: detailInclude,
    });
    return this.detailDto(row);
  }

  async changeStatus(account: Account, facilityId: string, status: Status): Promise<FacilityDetail> {
    const current = await this.managedFacility(account, facilityId);
    if (current.status === "CLOSED" && status !== "CLOSED") throw new ApplicationError(409, "FACILITY_CLOSED", "Closed facilities cannot be reopened.");
    const row = await this.prisma.facility.update({ where: { id: facilityId }, data: { status, updatedAt: new Date() }, include: detailInclude });
    return this.detailDto(row);
  }

  async addCourt(account: Account, facilityId: string, input: CreateCourt): Promise<Court> {
    await this.managedFacility(account, facilityId);
    return courtDto(await this.prisma.court.create({ data: { facilityId, code: input.code, name: input.name, type: input.type, surfaceType: input.surfaceType, lighting: input.lighting, baseHourlyRate: input.baseHourlyRate, currencyCode: "PHP" } }));
  }

  async setOperatingHours(account: Account, facilityId: string, input: Hours) {
    await this.managedFacility(account, facilityId);
    return this.prisma.facilityOperatingHours.upsert({ where: { facilityId_dayOfWeek: { facilityId, dayOfWeek: input.dayOfWeek } }, create: { facilityId, dayOfWeek: input.dayOfWeek, closed: input.closed, opensAt: time(input.opensAt), closesAt: time(input.closesAt) }, update: { closed: input.closed, opensAt: time(input.opensAt), closesAt: time(input.closesAt) } });
  }

  async addRateRule(account: Account, courtId: string, input: RateRule) {
    const court = await this.managedCourt(account, courtId);
    return this.prisma.courtRateRule.create({ data: { courtId: court.id, name: input.name, dayOfWeek: input.dayOfWeek, startsAt: time(input.startsAt), endsAt: time(input.endsAt), hourlyRate: input.hourlyRate, effectiveFrom: date(input.effectiveFrom), effectiveUntil: date(input.effectiveUntil), priority: input.priority } });
  }

  async addAvailabilityBlock(account: Account, courtId: string, input: AvailabilityBlock) {
    const court = await this.managedCourt(account, courtId);
    return this.prisma.courtAvailabilityBlock.create({ data: { courtId: court.id, type: input.type, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), reason: optional(input.reason), createdByUserId: account.userId } });
  }

  async availability(facilityId: string, selectedDate: string, durationMinutes: number, now = new Date()): Promise<FacilityAvailability> {
    const facility = await this.prisma.facility.findUnique({ where: { id: facilityId }, select: { id: true, status: true, timezone: true } });
    if (!facility || facility.status !== "ACTIVE") throw new ApplicationError(404, "FACILITY_NOT_FOUND", "Facility not found.");

    let dayStart: Date;
    let dayEnd: Date;
    try {
      dayStart = zonedDateTimeToInstant(selectedDate, 0, facility.timezone);
      dayEnd = zonedDateTimeToInstant(isoDatePlusDays(selectedDate, 1), 0, facility.timezone);
    } catch {
      throw new ApplicationError(500, "INVALID_FACILITY_TIMEZONE", "The facility timezone is invalid.");
    }

    const dayOfWeek = isoDayOfWeek(selectedDate);
    const [schedule, courts] = await Promise.all([
      this.prisma.facilityOperatingHours.findUnique({ where: { facilityId_dayOfWeek: { facilityId, dayOfWeek } } }),
      this.prisma.court.findMany({
        where: { facilityId, status: "ACTIVE" },
        orderBy: { name: "asc" },
        include: {
          rateRules: { where: { active: true }, orderBy: [{ priority: "desc" }, { id: "asc" }] },
          availabilityBlocks: { where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } } },
          bookings: { where: {
            startsAt: { lt: dayEnd },
            endsAt: { gt: dayStart },
            OR: [
              { status: { in: ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"] } },
              { status: "HOLD", holdExpiresAt: { gt: now } },
            ],
          } },
        },
      }),
    ]);

    const opensAtMinutes = timeMinutes(schedule?.opensAt ?? null);
    const closesAtMinutes = timeMinutes(schedule?.closesAt ?? null);
    if (!schedule || schedule.closed || opensAtMinutes === null || closesAtMinutes === null) {
      return { facilityId, date: selectedDate, timezone: facility.timezone, durationMinutes, slots: [] };
    }

    const slots = generateAvailability({
      date: selectedDate,
      timezone: facility.timezone,
      durationMinutes,
      opensAtMinutes,
      closesAtMinutes,
      now,
      courts: courts.map((court) => ({
        courtId: court.id,
        courtName: court.name,
        baseHourlyRate: court.baseHourlyRate.toNumber(),
        currencyCode: court.currencyCode.trim(),
        rateRules: court.rateRules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startsAtMinutes: timeMinutes(rule.startsAt),
          endsAtMinutes: timeMinutes(rule.endsAt),
          hourlyRate: rule.hourlyRate.toNumber(),
          effectiveFrom: dateOnly(rule.effectiveFrom),
          effectiveUntil: dateOnly(rule.effectiveUntil),
          priority: rule.priority,
        })),
        blocks: court.availabilityBlocks.map((block) => ({ startsAt: block.startsAt, endsAt: block.endsAt })),
        reservations: court.bookings.map((booking) => ({ startsAt: booking.startsAt, endsAt: booking.endsAt })),
      })),
    });
    return { facilityId, date: selectedDate, timezone: facility.timezone, durationMinutes, slots };
  }

  private async managedFacility(account: Account, facilityId: string) {
    const row = await this.prisma.facility.findUnique({ where: { id: facilityId } });
    if (!row) throw new ApplicationError(404, "FACILITY_NOT_FOUND", "Facility not found.");
    await this.assertCanManage(account, row.organizationId);
    return row;
  }

  private async managedCourt(account: Account, courtId: string) {
    const row = await this.prisma.court.findUnique({ where: { id: courtId }, include: { facility: true } });
    if (!row) throw new ApplicationError(404, "COURT_NOT_FOUND", "Court not found.");
    await this.assertCanManage(account, row.facility.organizationId);
    return row;
  }

  private async assertCanManage(account: Account, organizationId: string) {
    if (account.roles.includes("PLATFORM_ADMIN")) return;
    const allowed = await this.prisma.organization.findFirst({ where: { id: organizationId, OR: [{ ownerUserId: account.userId }, { members: { some: { userId: account.userId, status: "ACTIVE", roleCode: { in: ["CLUB_ADMIN", "COURT_OWNER", "STAFF"] } } } }] }, select: { id: true } });
    if (!allowed) throw new ApplicationError(403, "INSUFFICIENT_PERMISSION", "You cannot manage this organization.");
  }

  private async list(where: Prisma.FacilityWhereInput, page: number, size: number): Promise<Page<FacilitySummary>> {
    const [rows, totalElements] = await Promise.all([
      this.prisma.facility.findMany({ where, include: { location: true, courts: { where: { status: "ACTIVE" }, select: { baseHourlyRate: true } } }, orderBy: { name: "asc" }, skip: page * size, take: size }),
      this.prisma.facility.count({ where }),
    ]);
    const content = rows.map((row): FacilitySummary => ({ facilityId: row.id, name: row.name, status: row.status as FacilitySummary["status"], city: row.location?.city ?? "", province: row.location?.province ?? "", latitude: row.location?.latitude.toNumber() ?? 0, longitude: row.location?.longitude.toNumber() ?? 0, activeCourts: row.courts.length, startingHourlyRate: row.courts.length ? Math.min(...row.courts.map((court) => court.baseHourlyRate.toNumber())) : 0, currencyCode: "PHP" }));
    return { content, totalElements, totalPages: Math.ceil(totalElements / size), number: page, size };
  }

  private detailDto(row: FacilityDetailRow): FacilityDetail {
    if (!row.location) throw new ApplicationError(500, "FACILITY_LOCATION_MISSING", "Facility location is missing.");
    return { facilityId: row.id, organizationId: row.organizationId, name: row.name, branchCode: row.branchCode, description: row.description ?? undefined, status: row.status as FacilityDetail["status"], contactNumber: row.contactNumber ?? undefined, contactEmail: row.contactEmail ?? undefined, timezone: row.timezone, location: { addressLine1: row.location.addressLine1, addressLine2: row.location.addressLine2 ?? undefined, barangay: row.location.barangay ?? undefined, city: row.location.city, province: row.location.province, postalCode: row.location.postalCode ?? undefined, countryCode: row.location.countryCode.trim(), latitude: row.location.latitude.toNumber(), longitude: row.location.longitude.toNumber(), directionsLandmark: row.location.directionsLandmark ?? undefined, verified: row.location.verified }, courts: row.courts.map(courtDto), createdAt: row.createdAt.toISOString() };
  }
}
