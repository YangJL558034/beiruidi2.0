import { NextRequest, NextResponse } from "next/server";
import { getNavigationConfig, saveNavigationConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    navigation: {
      en: getNavigationConfig("en"),
      cn: getNavigationConfig("cn")
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const locale = body.locale === "cn" ? "cn" : "en";
    const navigation = saveNavigationConfig(body.navigation ?? body, locale);
    return NextResponse.json({ navigation, locale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save navigation." },
      { status: 400 }
    );
  }
}
