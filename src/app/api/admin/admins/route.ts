import { NextRequest, NextResponse } from "next/server";
import { getAdminUsers, updateAdminRole, updateAdminEmail, updateAdminPassword } from "@/lib/db";

export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ admins: getAdminUsers() }, { headers: { "Cache-Control": "no-store" } }); }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "管理员编号无效。" }, { status: 400 });
    if (body.role !== undefined) {
      const role = String(body.role);
      if (!["owner", "editor", "support", "sales"].includes(role)) return NextResponse.json({ error: "角色无效。" }, { status: 400 });
      return NextResponse.json({ admin: updateAdminRole(id, role as "owner" | "editor" | "support" | "sales") });
    }
    if (body.email !== undefined) {
      return NextResponse.json({ admin: updateAdminEmail(id, String(body.email)) });
    }
    if (body.password !== undefined) {
      return NextResponse.json({ admin: updateAdminPassword(id, String(body.password)) });
    }
    return NextResponse.json({ error: "未指定要修改的字段。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新失败。" }, { status: 400 });
  }
}
