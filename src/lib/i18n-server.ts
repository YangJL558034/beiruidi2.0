import "server-only";

import { headers } from "next/headers";
import type { Locale } from "@/lib/navigation";

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  return headerStore.get("x-sza-locale") === "cn" ? "cn" : "en";
}
