import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/ogg"]);

export async function GET() {
  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    await fsPromises.access(dir);
  } catch {
    return NextResponse.json({ media: [] });
  }
  const files = await fsPromises.readdir(dir);
  const media = await Promise.all(files.map(async (filename) => {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return null;
    const fullPath = path.join(dir, filename);
    const stats = await fsPromises.stat(fullPath);
    if (!stats.isFile()) return null;
    const extension = path.extname(filename).slice(1).toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);
    const isVideo = ["mp4", "webm", "ogg"].includes(extension);
    if (!isImage && !isVideo) return null;
    return {
      filename,
      url: `/api/media/${filename}`,
      type: isImage ? "image" : "video",
      extension,
      size: stats.size,
      createdAt: stats.birthtime.toISOString()
    };
  }));
  return NextResponse.json({ media: media.filter(Boolean).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
}

export async function DELETE(request: NextRequest) {
  const { filename } = await request.json();
  if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  const target = path.join(dir, filename);
  try {
    await fsPromises.unlink(target);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type)) return NextResponse.json({ error: "\u4ec5\u652f\u6301 JPG\u3001PNG\u3001WEBP\u3001GIF\u3001MP4\u3001WEBM \u6216 OGG \u6587\u4ef6\u3002" }, { status: 400 });
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`);
  try {
    await pipeline(Readable.fromWeb(file.stream() as unknown as import("node:stream/web").ReadableStream), fs.createWriteStream(target, { flags: "wx" }));
    const filename = path.basename(target);
    return NextResponse.json({ url: `/api/media/${filename}`, legacyUrl: `/uploads/${filename}` }, { status: 201 });
  } catch {
    fs.rmSync(target, { force: true });
    return NextResponse.json({ error: "\u5a92\u4f53\u6587\u4ef6\u4fdd\u5b58\u5931\u8d25\u3002\u8bf7\u68c0\u67e5\u78c1\u76d8\u7a7a\u95f4\u6216\u53cd\u5411\u4ee3\u7406\u8d85\u65f6\u8bbe\u7f6e\u3002" }, { status: 500 });
  }
}