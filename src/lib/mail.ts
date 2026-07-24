import nodemailer from "nodemailer";
import { getSystemSettings } from "@/lib/db";

type Mail = { to: string; subject: string; text: string; html?: string };

export async function sendConfiguredMail(message: Mail) {
  const settings = getSystemSettings() as Record<string, unknown>;
  const host = String(
    settings.smtpHost ?? process.env.SZA_SMTP_HOST ?? "",
  ).trim();
  const from = String(
    settings.smtpFrom ??
      process.env.SZA_SMTP_FROM ??
      settings.smtpUser ??
      process.env.SZA_SMTP_USER ??
      "",
  ).trim();
  if (!host || !from) return { sent: false, reason: "SMTP is not configured" };
  const configuredPort = Number(
    settings.smtpPort ?? process.env.SZA_SMTP_PORT ?? 587,
  );
  const port =
    Number.isInteger(configuredPort) &&
    configuredPort > 0 &&
    configuredPort <= 65535
      ? configuredPort
      : 587;
  const user = String(settings.smtpUser ?? process.env.SZA_SMTP_USER ?? "");
  const password = String(
    settings.smtpPassword ?? process.env.SZA_SMTP_PASSWORD ?? "",
  );
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });
  await transport.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return { sent: true };
}
