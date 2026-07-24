import { NextResponse } from "next/server";
import {
  checkDatabaseConnection,
  getDatabasePath,
  getSystemSettings,
} from "@/lib/db";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const file = getDatabasePath();
    const stat = fs.statSync(file);
    if (!checkDatabaseConnection()) throw new Error("Database query failed");
    const settings = getSystemSettings() as Record<string, unknown>;
    const mailConfigured = Boolean(
      String(settings.smtpHost ?? process.env.SZA_SMTP_HOST ?? "").trim() &&
        String(
          settings.smtpFrom ??
            process.env.SZA_SMTP_FROM ??
            settings.smtpUser ??
            process.env.SZA_SMTP_USER ??
            "",
        ).trim(),
    );
    const malwareScanConfigured = Boolean(
      process.env.SZA_CLAMAV_HOST?.trim(),
    );
    return NextResponse.json(
      {
        ok: true,
        service: "sza-power",
        database: { available: true, updatedAt: stat.mtime.toISOString() },
        mail: { configured: mailConfigured },
        support: {
          malwareScanConfigured,
          malwareScanRequired:
            process.env.SZA_REQUIRE_MALWARE_SCAN === "true",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, service: "sza-power" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
