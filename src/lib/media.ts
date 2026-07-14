export function isManagedMediaUrl(value: string | undefined | null): boolean {
  return /^\/(?:uploads|api\/media)\//.test(String(value ?? ""));
}
