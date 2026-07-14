import { NextRequest, NextResponse } from "next/server";
import { getInquiries, updateInquiryStatus } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ inquiries: getInquiries() });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status ?? "");

    if (!id || !["new", "contacted", "closed"].includes(status)) {
      return NextResponse.json({ error: "Valid id and status are required." }, { status: 400 });
    }

    const inquiry = updateInquiryStatus(id, status as "new" | "contacted" | "closed");
    return NextResponse.json({ inquiry });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
