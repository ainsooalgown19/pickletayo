import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import type { Account } from "@/modules/identity/domain/account";
import { bookingEmail, type BookingEmailData, type BookingEmailKind } from "./email-templates";
import { sendEmail } from "../infrastructure/gmail-email-sender";

export type NotificationPreferences = { bookingUpdates: boolean; accountSecurity: boolean; productNews: boolean };

export class NotificationService {
  private readonly prisma = getPrismaClient();

  async preferences(account: Account): Promise<NotificationPreferences> {
    const value = await this.prisma.notificationPreference.upsert({
      where: { userId: account.userId },
      create: { userId: account.userId },
      update: {},
    });
    return { bookingUpdates: value.bookingUpdates, accountSecurity: value.accountSecurity, productNews: value.productNews };
  }

  async updatePreferences(account: Account, input: NotificationPreferences): Promise<NotificationPreferences> {
    const value = await this.prisma.notificationPreference.upsert({
      where: { userId: account.userId },
      create: { userId: account.userId, ...input },
      update: { ...input, updatedAt: new Date() },
    });
    return { bookingUpdates: value.bookingUpdates, accountSecurity: value.accountSecurity, productNews: value.productNews };
  }

  static async queueBookingEmail(transaction: Prisma.TransactionClient, input: {
    userId: string;
    recipientEmail: string;
    bookingId: string;
    kind: BookingEmailKind;
    data: BookingEmailData;
  }) {
    if (!input.recipientEmail) return;
    const preferences = await transaction.notificationPreference.findUnique({ where: { userId: input.userId } });
    if (preferences && !preferences.bookingUpdates) return;
    const message = bookingEmail(input.kind, input.data);
    await transaction.notificationOutbox.upsert({
      where: { idempotencyKey: `${input.bookingId}:${input.kind}` },
      create: {
        userId: input.userId,
        recipientEmail: input.recipientEmail,
        templateKey: input.kind,
        subject: message.subject,
        htmlBody: message.html,
        textBody: message.text,
        payload: { bookingId: input.bookingId, reference: input.data.reference },
        idempotencyKey: `${input.bookingId}:${input.kind}`,
      },
      update: {},
    });
  }

  async processPending(limit = 25) {
    const now = new Date();
    const candidates = await this.prisma.notificationOutbox.findMany({
      where: { status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: now }, attempts: { lt: 5 } },
      orderBy: { createdAt: "asc" },
      take: Math.min(100, Math.max(1, limit)),
    });
    let sent = 0;
    let failed = 0;
    for (const candidate of candidates) {
      const claim = await this.prisma.notificationOutbox.updateMany({
        where: { id: candidate.id, status: candidate.status, attempts: candidate.attempts },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      if (!claim.count) continue;
      const attempts = candidate.attempts + 1;
      try {
        const providerMessageId = await sendEmail({ to: candidate.recipientEmail, subject: candidate.subject, html: candidate.htmlBody, text: candidate.textBody });
        await this.prisma.notificationOutbox.update({ where: { id: candidate.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId, lastError: null } });
        sent += 1;
      } catch (cause) {
        const lastError = (cause instanceof Error ? cause.message : String(cause)).slice(0, 1000);
        const dead = attempts >= 5;
        await this.prisma.notificationOutbox.update({ where: { id: candidate.id }, data: {
          status: dead ? "DEAD" : "FAILED",
          lastError,
          nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000),
        } });
        failed += 1;
      }
    }
    return { claimed: sent + failed, sent, failed };
  }
}
