import "server-only";

import nodemailer from "nodemailer";
import { getEmailEnvironment } from "./email-environment";

export type EmailMessage = { to: string; subject: string; html: string; text: string };

export async function sendEmail(message: EmailMessage) {
  const environment = getEmailEnvironment();
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: environment.GMAIL_USER, pass: environment.GMAIL_APP_PASSWORD },
  });
  const result = await transport.sendMail({ from: environment.EMAIL_FROM, ...message });
  return result.messageId;
}
