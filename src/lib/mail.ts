import nodemailer from "nodemailer";
import { getSystemSettings } from "@/lib/db";

type Mail = { to: string; subject: string; text: string; html?: string };

export async function sendConfiguredMail(message: Mail) {
  const settings = getSystemSettings() as Record<string, unknown>;
  const host = String(settings.smtpHost ?? "").trim();
  const from = String(settings.smtpFrom ?? settings.smtpUser ?? "").trim();
  if (!host || !from) return { sent: false, reason: "SMTP is not configured" };
  const port = Number(settings.smtpPort ?? 587);
  const user = String(settings.smtpUser ?? "");
  const password = String(settings.smtpPassword ?? "");
  const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: user ? { user, pass: password } : undefined });
  await transport.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
  return { sent: true };
}
