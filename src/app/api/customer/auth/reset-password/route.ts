import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/db";
import { getRequestIp, requestOriginAllowed } from "@/lib/request-security";
import { resetCustomerPassword } from "@/lib/support-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!requestOriginAllowed(request))
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  const rate = consumeRateLimit(
    `customer-reset-submit:${getRequestIp(request)}`,
    10,
    60 * 60_000,
  );
  if (!rate.allowed)
    return NextResponse.json({ error: "请求过于频繁。" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  try {
    const ok = resetCustomerPassword(
      String(body.token ?? ""),
      String(body.password ?? ""),
    );
    if (!ok)
      return NextResponse.json(
        { error: "重置链接无效或已过期。" },
        { status: 400 },
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "密码重置失败。" },
      { status: 400 },
    );
  }
}
