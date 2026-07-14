import { GET as getMedia } from "@/app/api/media/[filename]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ filename: string }> }) {
  return getMedia(request, context);
}
