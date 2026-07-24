"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { Locale } from "@/lib/navigation";

const LocaleContext = createContext<Locale>("en");
const subscribe = () => () => undefined;

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const pathname = usePathname();
  const pathLocale = getLocaleFromPathname(pathname);
  const locale = useSyncExternalStore(
    subscribe,
    () => pathLocale,
    () => initialLocale,
  );

  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
