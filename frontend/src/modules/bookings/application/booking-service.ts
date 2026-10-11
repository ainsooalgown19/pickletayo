import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AdminBooking, Booking, Page } from "@/lib/api/contracts";
import { ApplicationError } from "@/lib/api/route-errors";
import { getPrismaClient } from "@/lib/prisma";
import type { Account } from "@/modules/identity/domain/account";
import { NotificationService } from "@/modules/notifications/application/notification-service";
import { generateAvailability, localDateTimeAt } from "@/modules/facilities/application/availability-engine";
import type { z } from "zod";
import type { createHoldSchema } from "../api/schemas";
import { assertCancellable, assertCheckInAllowed, bookingDurationMinutes, bookingReference } from "./booking-rules";

type CreateHold = z.infer<typeof createHoldSchema>;
type BookingRow = Prisma.CourtBookingGetPayload<object>;
type AdminBookingRow = Prisma.CourtBookingGetPayload<{ include: {
  facility: { select: { name: true } };
  court: { select: { name: true } };
  bookedBy: { include: { profile: true } };
} }>;

function dto(row: BookingRow): Booking {
  return {
    bookingId: row.id,
    reference: row.reference,
    facilityId: row.facilityId,
    courtId: row.courtId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status as Booking["status"],
    subtotalAmount: row.subtotalAmount.toNumber(),
    discountAmount: row.discountAmount.toNumber(),
    totalAmount: row.totalAmount.toNumber(),
    currencyCode: row.currencyCode.trim(),
    paymentStatus: row.paymentStatus as Booking["paymentStatus"],
    holdExpiresAt: row.holdExpiresAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function adminDto(row: AdminBookingRow): AdminBooking {
  const profile = row.bookedBy.profile;
  const playerName = [profile?.givenName, profile?.familyName].filter(Boolean).join(" ");
  return {
    ...dto(row),
    facilityName: row.facility.name,
    courtName: row.court.name,
    playerId: row.bookedByUserId,
    playerName: playerName || "Player",
    updatedAt: row.updatedAt.toISOString(),
  };
}

function timeMinutes(value: Date | null) { return value ? value.getUTCHours() * 60 + value.getUTCMinutes() : null; }
function dateOnly(value: Date | null) { return value ? value.toISOString().slice(0, 10) : null; }

export class BookingService {
  private readonly prisma = getPrismaClient();

  async hold(account: Account, idempotencyKey: string, input: CreateHold, now = new Date()): Promise<Booking> {
    const existing = await this.findIdempotent(account.userId, idempotencyKey);
    if (existing) return dto(existing);
    await this.expireHolds(now);

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const durationMinutes = bookingDurationMinutes(startsAt, endsAt, now);
    const court = await this.prisma.court.findUnique({
      where: { id: input.courtId },
      include: { facility: { select: { id: true, organizationId: true, name: true, status: true, timezone: true } } },
    });
    if (!court || court.status !== "ACTIVE") throw new ApplicationError(404, "COURT_NOT_FOUND", "Court not found.");
    if (court.facility.status !== "ACTIVE") throw new ApplicationError(404, "FACILITY_NOT_FOUND", "Facility not found.");

    const localStart = localDateTimeAt(startsAt, court.facility.timezone);
    const localEnd = localDateTimeAt(new Date(endsAt.getTime() - 1), court.facility.timezone);
    if (localStart.date !== localEnd.date) throw new ApplicationError(422, "BOOKING_CROSSES_DAY", "Booking must start and end on the same facility-local date.");

    const [schedule, rateRules, blocks, reservations] = await Promise.all([
      this.prisma.facilityOperatingHours.findUnique({ where: { facilityId_dayOfWeek: { facilityId: court.facilityId, dayOfWeek: localStart.dayOfWeek } } }),
      this.prisma.courtRateRule.findMany({ where: { courtId: court.id, active: true }, orderBy: [{ priority: "desc" }, { id: "asc" }] }),
      this.prisma.courtAvailabilityBlock.findMany({ where: { courtId: court.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } }),
      this.prisma.courtBooking.findMany({ where: {
        courtId: court.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt },
        OR: [{ status: { in: ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"] } }, { status: "HOLD", holdExpiresAt: { gt: now } }],
      } }),
    ]);
    const opensAtMinutes = timeMinutes(schedule?.opensAt ?? null);
    const closesAtMinutes = timeMinutes(schedule?.closesAt ?? null);
    if (!schedule || schedule.closed || opensAtMinutes === null || closesAtMinutes === null) throw new ApplicationError(422, "FACILITY_CLOSED", "Facility is closed at the requested time.");

    const slots = generateAvailability({
      date: localStart.date,
      timezone: court.facility.timezone,
      durationMinutes,
      opensAtMinutes,
      closesAtMinutes,
      now,
      courts: [{
        courtId: court.id,
        courtName: court.name,
        baseHourlyRate: court.baseHourlyRate.toNumber(),
        currencyCode: court.currencyCode.trim(),
        rateRules: rateRules.map((rule) => ({ dayOfWeek: rule.dayOfWeek, startsAtMinutes: timeMinutes(rule.startsAt), endsAtMinutes: timeMinutes(rule.endsAt), hourlyRate: rule.hourlyRate.toNumber(), effectiveFrom: dateOnly(rule.effectiveFrom), effectiveUntil: dateOnly(rule.effectiveUntil), priority: rule.priority })),
        blocks: blocks.map((block) => ({ startsAt: block.startsAt, endsAt: block.endsAt })),
        reservations: reservations.map((booking) => ({ startsAt: booking.startsAt, endsAt: booking.endsAt })),
      }],
    });
    const selected = slots.find((slot) => slot.startsAt === startsAt.toISOString() && slot.endsAt === endsAt.toISOString());
    if (!selected) throw new ApplicationError(409, "COURT_NOT_AVAILABLE", "Court is no longer available for the requested time.");

    const holdExpiresAt = new Date(now.getTime() + 10 * 60_000);
    try {
      const created = await this.prisma.$transaction(async (transaction) => {
        const duplicate = await transaction.courtBooking.findUnique({ where: { bookedByUserId_idempotencyKey: { bookedByUserId: account.userId, idempotencyKey } } });
        if (duplicate) return duplicate;
        const booking = await transaction.courtBooking.create({ data: {
          organizationId: court.facility.organizationId,
          reference: bookingReference(now, crypto.randomUUID()),
          facilityId: court.facilityId,
          courtId: court.id,
          bookedByUserId: account.userId,
          startsAt,
          endsAt,
          status: "HOLD",
          subtotalAmount: selected.price,
          discountAmount: 0,
          totalAmount: selected.price,
          currencyCode: selected.currencyCode,
          paymentStatus: "UNPAID",
          idempotencyKey,
          holdExpiresAt,
        } });
        await transaction.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: null, toStatus: "HOLD", changedByUserId: account.userId, reason: "Booking hold created" } });
        await NotificationService.queueBookingEmail(transaction, {
          userId: account.userId,
          recipientEmail: account.email,
          bookingId: booking.id,
          kind: "BOOKING_HOLD",
          data: {
            playerName: [account.givenName, account.familyName].filter(Boolean).join(" ") || "Player",
            reference: booking.reference,
            facilityName: court.facility.name,
            courtName: court.name,
            startsAt,
            endsAt,
            totalAmount: selected.price,
            currencyCode: selected.currencyCode,
            holdExpiresAt,
          },
        });
        return booking;
      });
      return dto(created);
    } catch (cause) {
      const duplicate = await this.findIdempotent(account.userId, idempotencyKey);
      if (duplicate) return dto(duplicate);
      const message = cause instanceof Error ? cause.message : String(cause);
      if (message.includes("court_bookings_no_active_overlap") || message.toLowerCase().includes("exclusion constraint")) {
        throw new ApplicationError(409, "COURT_ALREADY_BOOKED", "Court is no longer available for the requested time.");
      }
      throw cause;
    }
  }

  async list(account: Account, page: number, size: number): Promise<Page<Booking>> {
    await this.expireHolds(new Date());
    const where = { bookedByUserId: account.userId };
    const [rows, totalElements] = await Promise.all([
      this.prisma.courtBooking.findMany({ where, orderBy: { createdAt: "desc" }, skip: page * size, take: size }),
      this.prisma.courtBooking.count({ where }),
    ]);
    return { content: rows.map(dto), totalElements, totalPages: Math.ceil(totalElements / size), number: page, size };
  }

  async get(account: Account, bookingId: string): Promise<Booking> {
    await this.expireHolds(new Date());
    return dto(await this.owned(account.userId, bookingId));
  }

  async cancel(account: Account, bookingId: string, now = new Date()): Promise<Booking> {
    await this.expireHolds(now);
    return dto(await this.prisma.$transaction(async (transaction) => {
      const booking = await transaction.courtBooking.findFirst({ where: { id: bookingId, bookedByUserId: account.userId }, include: { facility: { select: { name: true } }, court: { select: { name: true } } } });
      if (!booking) throw new ApplicationError(404, "BOOKING_NOT_FOUND", "Booking not found.");
      assertCancellable(booking.status);
      const updated = await transaction.courtBooking.update({ where: { id: booking.id }, data: { status: "CANCELLED", holdExpiresAt: null, updatedAt: now } });
      await transaction.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: booking.status, toStatus: "CANCELLED", changedByUserId: account.userId, reason: "Cancelled by player" } });
      await transaction.notificationOutbox.updateMany({ where: { idempotencyKey: `${booking.id}:BOOKING_HOLD`, status: { in: ["PENDING", "FAILED"] } }, data: { status: "DEAD", lastError: "Superseded by booking cancellation" } });
      await NotificationService.queueBookingEmail(transaction, {
        userId: account.userId,
        recipientEmail: account.email,
        bookingId: booking.id,
        kind: "BOOKING_CANCELLED",
        data: { playerName: [account.givenName, account.familyName].filter(Boolean).join(" ") || "Player", reference: booking.reference, facilityName: booking.facility.name, courtName: booking.court.name, startsAt: booking.startsAt, endsAt: booking.endsAt, totalAmount: booking.totalAmount.toNumber(), currencyCode: booking.currencyCode.trim() },
      });
      return updated;
    }));
  }

  async listForOperator(account: Account, page: number, size: number, query?: string, status?: string): Promise<Page<AdminBooking>> {
    await this.expireHolds(new Date());
    const scope = await this.operatorScope(account);
    const search = query?.trim();
    const where: Prisma.CourtBookingWhereInput = {
      ...scope,
      ...(status ? { status } : {}),
      ...(search ? { OR: [
        { reference: { contains: search, mode: "insensitive" } },
        { facility: { name: { contains: search, mode: "insensitive" } } },
        { court: { name: { contains: search, mode: "insensitive" } } },
        { bookedBy: { profile: { is: { givenName: { contains: search, mode: "insensitive" } } } } },
        { bookedBy: { profile: { is: { familyName: { contains: search, mode: "insensitive" } } } } },
      ] } : {}),
    };
    const include = { facility: { select: { name: true } }, court: { select: { name: true } }, bookedBy: { include: { profile: true } } } as const;
    const [rows, totalElements] = await Promise.all([
      this.prisma.courtBooking.findMany({ where, include, orderBy: { startsAt: "desc" }, skip: page * size, take: size }),
      this.prisma.courtBooking.count({ where }),
    ]);
    return { content: rows.map(adminDto), totalElements, totalPages: Math.ceil(totalElements / size), number: page, size };
  }

  async cancelForOperator(account: Account, bookingId: string, reason?: string, now = new Date()): Promise<AdminBooking> {
    return this.operatorTransition(account, bookingId, "CANCELLED", reason || "Cancelled by operator", now);
  }

  async checkInForOperator(account: Account, bookingId: string, reason?: string, now = new Date()): Promise<AdminBooking> {
    return this.operatorTransition(account, bookingId, "CHECKED_IN", reason || "Player checked in", now);
  }

  private findIdempotent(userId: string, idempotencyKey: string) {
    return this.prisma.courtBooking.findUnique({ where: { bookedByUserId_idempotencyKey: { bookedByUserId: userId, idempotencyKey } } });
  }

  private async owned(userId: string, bookingId: string) {
    const booking = await this.prisma.courtBooking.findFirst({ where: { id: bookingId, bookedByUserId: userId } });
    if (!booking) throw new ApplicationError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    return booking;
  }

  private async operatorScope(account: Account): Promise<Prisma.CourtBookingWhereInput> {
    if (account.roles.includes("PLATFORM_ADMIN")) return {};
    const organizations = await this.prisma.organization.findMany({
      where: { OR: [
        { ownerUserId: account.userId },
        { members: { some: { userId: account.userId, status: "ACTIVE", roleCode: { in: ["CLUB_ADMIN", "COURT_OWNER", "STAFF"] } } } },
      ] },
      select: { id: true },
    });
    return { organizationId: { in: organizations.map(({ id }) => id) } };
  }

  private async operatorTransition(account: Account, bookingId: string, target: "CANCELLED" | "CHECKED_IN", reason: string, now: Date): Promise<AdminBooking> {
    await this.expireHolds(now);
    const scope = await this.operatorScope(account);
    const include = { facility: { select: { name: true } }, court: { select: { name: true } }, bookedBy: { include: { profile: true } } } as const;
    const updated = await this.prisma.$transaction(async (transaction) => {
      const booking = await transaction.courtBooking.findFirst({ where: { id: bookingId, ...scope }, include: { facility: { select: { name: true } }, court: { select: { name: true } }, bookedBy: { select: { email: true, profile: true } } } });
      if (!booking) throw new ApplicationError(404, "BOOKING_NOT_FOUND", "Booking not found.");
      if (target === "CANCELLED") assertCancellable(booking.status);
      else assertCheckInAllowed(booking.status);
      await transaction.courtBooking.update({ where: { id: booking.id }, data: { status: target, holdExpiresAt: null, updatedAt: now } });
      await transaction.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: booking.status, toStatus: target, changedByUserId: account.userId, reason, changedAt: now } });
      if (target === "CANCELLED" && booking.bookedBy.email) {
        await transaction.notificationOutbox.updateMany({ where: { idempotencyKey: `${booking.id}:BOOKING_HOLD`, status: { in: ["PENDING", "FAILED"] } }, data: { status: "DEAD", lastError: "Superseded by booking cancellation" } });
        await NotificationService.queueBookingEmail(transaction, {
          userId: booking.bookedByUserId,
          recipientEmail: booking.bookedBy.email,
          bookingId: booking.id,
          kind: "BOOKING_CANCELLED",
          data: { playerName: [booking.bookedBy.profile?.givenName, booking.bookedBy.profile?.familyName].filter(Boolean).join(" ") || "Player", reference: booking.reference, facilityName: booking.facility.name, courtName: booking.court.name, startsAt: booking.startsAt, endsAt: booking.endsAt, totalAmount: booking.totalAmount.toNumber(), currencyCode: booking.currencyCode.trim() },
        });
      }
      return transaction.courtBooking.findUniqueOrThrow({ where: { id: booking.id }, include });
    });
    return adminDto(updated);
  }

  private async expireHolds(now: Date) {
    const expired = await this.prisma.courtBooking.findMany({ where: { status: { in: ["HOLD", "PENDING_PAYMENT"] }, holdExpiresAt: { lte: now } }, select: { id: true, status: true }, take: 100 });
    if (!expired.length) return;
    await this.prisma.$transaction(async (transaction) => {
      for (const booking of expired) {
        const changed = await transaction.courtBooking.updateMany({ where: { id: booking.id, status: booking.status, holdExpiresAt: { lte: now } }, data: { status: "EXPIRED", holdExpiresAt: null, updatedAt: now } });
        if (changed.count) await transaction.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: booking.status, toStatus: "EXPIRED", reason: "Booking hold expired", changedAt: now } });
      }
    });
  }
}
