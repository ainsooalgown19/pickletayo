import "server-only";

import { z } from "zod";

const emailEnvironmentSchema = z.object({
  EMAIL_PROVIDER: z.literal("gmail"),
  GMAIL_USER: z.string().email(),
  GMAIL_APP_PASSWORD: z.string().min(16),
  EMAIL_FROM: z.string().min(3),
});

export function getEmailEnvironment() {
  const parsed = emailEnvironmentSchema.safeParse({
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD?.replaceAll(" ", ""),
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.GMAIL_USER,
  });
  if (!parsed.success) {
    throw new Error("Email delivery is not configured. Set EMAIL_PROVIDER, GMAIL_USER, GMAIL_APP_PASSWORD, and EMAIL_FROM.");
  }
  return parsed.data;
}

export function emailDeliveryConfigured() {
  return emailEnvironmentSchema.safeParse({
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD?.replaceAll(" ", ""),
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.GMAIL_USER,
  }).success;
}
