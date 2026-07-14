import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getAdminProducts, saveProduct } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ products: getAdminProducts() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = saveProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save product." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    const product = saveProduct(body);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
