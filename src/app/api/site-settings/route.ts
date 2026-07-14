import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getSystemSettings() as Record<string, unknown>;
  return NextResponse.json({
    siteName: String(settings.siteName || "SZA POWER"),
    headerName: String(settings.headerName || settings.siteName || "SZA"),
    siteLogo: String(settings.siteLogo || ""),
    siteLogoAlt: String(settings.siteLogoAlt || settings.siteName || "SZA POWER"),
    showSiteName: settings.showSiteName !== false,
    contactEmail: String(settings.contactEmail || "sales@sza-power.com"),
    contactLocation: String(settings.contactLocation || "International mobile power brand"),
    contactDescription: String(settings.contactDescription || "Product, wholesale, OEM, and support requests"),
    contactPhone: String(settings.contactPhone || ""),
    contactWidgetEnabled: settings.contactWidgetEnabled !== false,
    contactWidgetTitleCn: String(settings.contactWidgetTitleCn || "联系我们"),
    contactWidgetTitleEn: String(settings.contactWidgetTitleEn || "Contact us"),
    contactWidgetSubtitleCn: String(settings.contactWidgetSubtitleCn || "我们很乐意为您提供帮助"),
    contactWidgetSubtitleEn: String(settings.contactWidgetSubtitleEn || "We are happy to help"),
    contactWidgetButtonCn: String(settings.contactWidgetButtonCn || "联系我们"),
    contactWidgetButtonEn: String(settings.contactWidgetButtonEn || "Contact us"),
    contactQrCode: String(settings.contactQrCode || ""),
    contactQrLabelCn: String(settings.contactQrLabelCn || "扫码联系我们"),
    contactQrLabelEn: String(settings.contactQrLabelEn || "Scan to contact us")
  }, { headers: { "Cache-Control": "no-store" } });
}
