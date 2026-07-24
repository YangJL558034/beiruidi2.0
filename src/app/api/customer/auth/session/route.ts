import { NextRequest, NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const customer = getCustomerFromRequest(request);
  return NextResponse.json(
    customer
      ? { authenticated: true, customer }
      : { authenticated: false, customer: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
