import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
};

function mediaPath(filename: string) {
  if (
    !/^[a-zA-Z0-9._-]+$/.test(filename) ||
    filename === "." ||
    filename === ".."
  )
    return null;
  return path.join(process.cwd(), "public", "uploads", filename);
}

function baseHeaders(filename: string, size: number) {
  const extension = path.extname(filename).slice(1).toLowerCase();
  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(size),
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  };
}

function parseRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : Number.NaN;
  let end = match[2] ? Number(match[2]) : Number.NaN;
  if (Number.isNaN(start)) {
    const suffixLength = end;
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    if (!Number.isFinite(start) || start < 0 || start >= size) return null;
    end = Number.isNaN(end) ? size - 1 : Math.min(end, size - 1);
  }
  if (!Number.isFinite(end) || end < start) return null;
  return { start, end };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  const target = mediaPath(filename);
  if (!target)
    return NextResponse.json(
      { error: "Invalid media name." },
      { status: 400 },
    );

  try {
    const stat = await fsPromises.stat(target);
    if (!stat.isFile()) throw new Error("Not a file");

    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const range = parseRange(rangeHeader, stat.size);
      if (!range)
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${stat.size}` },
        });
      const length = range.end - range.start + 1;
      const stream = fs.createReadStream(target, range);
      return new NextResponse(
        Readable.toWeb(stream) as unknown as ReadableStream,
        {
          status: 206,
          headers: {
            ...baseHeaders(filename, length),
            "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`,
          },
        },
      );
    }

    const stream = fs.createReadStream(target);
    return new NextResponse(
      Readable.toWeb(stream) as unknown as ReadableStream,
      { headers: baseHeaders(filename, stat.size) },
    );
  } catch {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }
}
