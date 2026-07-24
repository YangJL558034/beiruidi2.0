"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import {
  externalHref,
  isExternalHref,
  isHttpExternalHref,
  switchLocalePath,
  withLocale,
} from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import {
  defaultNavigation,
  type NavigationConfig,
  type NavigationItem,
  withIndustryNavigation,
} from "@/lib/navigation";
import { SearchModal } from "./SearchModal";

type PublicBrand = {
  siteName: string;
  headerName: string;
  siteLogo: string;
  siteLogoAlt: string;
  showSiteName: boolean;
};
type PublicProduct = {
  slug: string;
  name: string;
  nameCn: string;
  status?: string;
};
type HeaderLinkProps = {
  href: string;
  locale: "cn" | "en";
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

function HeaderLink({
  href,
  locale,
  className,
  onClick,
  children,
}: HeaderLinkProps) {
  const resolvedHref = isExternalHref(href)
    ? externalHref(href)
    : withLocale(href, locale);
  if (isExternalHref(href)) {
    return (
      <a
        href={resolvedHref}
        target={isHttpExternalHref(href) ? "_blank" : undefined}
        rel={isHttpExternalHref(href) ? "noopener noreferrer" : undefined}
        onClick={onClick}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={resolvedHref} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
function syncProductLinks(
  config: NavigationConfig,
  products: PublicProduct[],
  locale: "cn" | "en",
) {
  const enhanced = withIndustryNavigation(config, locale);
  if (!products.length) return enhanced;
  return {
    ...enhanced,
    items: enhanced.items.map((item) => {
      if (item.id !== "products" || !item.columns.length) return item;
      const first = item.columns[0];
      const all = {
        label: locale === "cn" ? "全部移动电源" : "All Power Banks",
        href: "/products",
        featured: true,
      };
      const productLinks = products
        .filter((product) => product.status !== "draft")
        .map((product) => ({
          label: locale === "cn" ? product.nameCn : product.name,
          href: `/products/${product.slug}`,
          featured: true,
        }));
      const productHrefs = new Set([
        "/products",
        ...productLinks.map((link) => link.href),
      ]);
      // Product records are synchronized, but custom admin links in this column remain visible.
      const customLinks = first.links.filter(
        (link) => !productHrefs.has(link.href),
      );
      const links = [all, ...productLinks, ...customLinks];
      return {
        ...item,
        columns: [{ ...first, links }, ...item.columns.slice(1)],
      };
    }),
  };
}

export function SiteHeader() {
  const [navigation, setNavigation] =
    useState<NavigationConfig>(defaultNavigation);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [brand, setBrand] = useState<PublicBrand>({
    siteName: "SZA POWER",
    headerName: "SZA",
    siteLogo: "",
    siteLogoAlt: "SZA POWER",
    showSiteName: true,
  });
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch(`/api/navigation?locale=${locale}`, { cache: "no-store" }).then(
        (response) => (response.ok ? response.json() : null),
      ),
      fetch("/api/site-settings", { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : null,
      ),
      fetch(`/api/products?locale=${locale}`, { cache: "no-store" }).then(
        (response) => (response.ok ? response.json() : null),
      ),
    ])
      .then(([navigationData, brandData, productData]) => {
        if (!mounted) return;
        if (navigationData?.navigation)
          setNavigation(
            syncProductLinks(
              navigationData.navigation,
              productData?.products ?? [],
              locale,
            ),
          );
        if (brandData?.siteName) setBrand(brandData as PublicBrand);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [locale]);

  const activeItem = useMemo(
    () => navigation.items.find((item) => item.id === activeId) ?? null,
    [activeId, navigation.items],
  );

  function openMega(id: string) {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setActiveId(id);
  }

  function closeMega(delay = 90) {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setActiveId(null), delay);
  }

  function toggleMega(item: NavigationItem) {
    if (!item.columns.length) return;
    setActiveId((current) => (current === item.id ? null : item.id));
  }

  return (
    <header
      className="sticky left-0 right-0 top-0 z-50"
      onMouseLeave={() => closeMega(140)}
      onMouseEnter={() => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
      }}
    >
      <div className="relative z-20 bg-[#f5f5f7]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-4">
          <Link
            href={withLocale("/", locale)}
            className="flex min-w-0 items-center gap-2 text-[13px] font-semibold tracking-normal text-[#1d1d1f]"
            aria-label={`${brand.headerName || brand.siteName || navigation.brand} home`}
            onMouseEnter={() => setActiveId(null)}
          >
            {brand.siteLogo ? (
              <Image
                unoptimized
                src={brand.siteLogo}
                alt={brand.siteLogoAlt || brand.siteName}
                width={96}
                height={28}
                className="h-6 w-auto max-w-[112px] object-contain"
              />
            ) : null}
            {brand.showSiteName || !brand.siteLogo ? (
              <span className="max-w-[120px] truncate">
                {brand.headerName || brand.siteName || navigation.brand}
              </span>
            ) : null}
          </Link>

          <nav
            aria-label={locale === "cn" ? "主导航" : "Primary navigation"}
            className="hidden flex-1 items-center justify-center gap-8 md:flex"
          >
            {navigation.items.map((item) =>
              item.columns.length ? (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => openMega(item.id)}
                  onFocus={() => openMega(item.id)}
                  onClick={() => toggleMega(item)}
                  aria-expanded={activeId === item.id}
                  aria-controls={`mega-menu-${item.id}`}
                  className={`min-h-11 text-xs font-normal transition ${
                    activeId === item.id
                      ? "text-[#1d1d1f]"
                      : "text-[#1d1d1f]/80 hover:text-[#1d1d1f]"
                  }`}
                >
                  {item.label}
                </button>
              ) : (
                <HeaderLink
                  key={item.id}
                  href={item.href}
                  locale={locale}
                  className="inline-flex min-h-11 items-center text-xs font-normal text-[#1d1d1f]/80 transition hover:text-[#1d1d1f]"
                >
                  {item.label}
                </HeaderLink>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-7 md:flex">
            <a
              href={switchLocalePath(pathname, locale === "cn" ? "en" : "cn")}
              className="text-xs font-medium text-[#1d1d1f]/78 hover:text-[#1d1d1f]"
              aria-label={locale === "cn" ? "Switch to English" : "切换至中文"}
              onMouseEnter={() => setActiveId(null)}
            >
              {locale === "cn" ? "EN" : "中文"}
            </a>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={locale === "cn" ? "打开搜索" : "Open search"}
              className="text-[#1d1d1f]/78 hover:text-[#1d1d1f]"
              onMouseEnter={() => setActiveId(null)}
            >
              <Search size={16} strokeWidth={1.8} />
            </button>
            <Link
              href={withLocale("/shop", locale)}
              aria-label={
                locale === "cn" ? "打开商城" : "Open store"
              }
              className="text-[#1d1d1f]/78 hover:text-[#1d1d1f]"
              onMouseEnter={() => setActiveId(null)}
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
            </Link>
            <Link
              href={withLocale("/account", locale)}
              aria-label={
                locale === "cn" ? "打开客户中心" : "Open customer center"
              }
              className="text-[#1d1d1f]/78 hover:text-[#1d1d1f]"
              onMouseEnter={() => setActiveId(null)}
            >
              <UserRound size={16} strokeWidth={1.8} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid size-9 place-items-center text-[#1d1d1f] md:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeItem ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-x-0 top-11 z-0 h-[calc(100vh-44px)] bg-white/28 backdrop-blur-[18px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setActiveId(null)}
            />
            <motion.div
              key={activeItem.id}
              id={`mega-menu-${activeItem.id}`}
              className="absolute inset-x-0 top-11 z-10 hidden overflow-hidden bg-[#fbfbfd] shadow-[0_28px_80px_rgba(0,0,0,0.08)] md:block"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => {
                if (closeTimer.current) window.clearTimeout(closeTimer.current);
              }}
            >
              <motion.div
                className="mx-auto grid max-w-5xl grid-cols-[1.1fr_0.72fr_0.72fr] gap-16 px-4 pb-16 pt-10"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
                  },
                }}
              >
                {activeItem.columns.map((column, columnIndex) => (
                  <motion.div
                    key={`${activeItem.id}-${column.eyebrow}-${columnIndex}`}
                    variants={{
                      hidden: { opacity: 0, y: -8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="mb-4 text-xs font-medium text-[#6e6e73]">
                      {column.eyebrow}
                    </p>
                    <div className="grid gap-3">
                      {column.links.map((link) => (
                        <HeaderLink
                          key={`${column.eyebrow}-${link.href}-${link.label}`}
                          href={link.href}
                          locale={locale}
                          onClick={() => setActiveId(null)}
                          className={`block tracking-normal text-[#1d1d1f] transition hover:text-[#0071e3] ${
                            link.featured && columnIndex === 0
                              ? "text-[24px] font-semibold leading-tight"
                              : "text-sm font-semibold"
                          }`}
                        >
                          {link.label}
                        </HeaderLink>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-navigation"
            role="navigation"
            aria-label={locale === "cn" ? "移动端导航" : "Mobile navigation"}
            className="relative z-20 max-h-[calc(100dvh-44px)] overflow-y-auto border-t border-black/10 bg-[#f5f5f7] px-6 py-5 md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {navigation.items.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                locale={locale}
                onClose={() => setMenuOpen(false)}
              />
            ))}
            <a
              href={switchLocalePath(pathname, locale === "cn" ? "en" : "cn")}
              onClick={() => setMenuOpen(false)}
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#0071e3]"
            >
              {locale === "cn" ? "English" : "切换至中文"}
            </a>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={withLocale("/shop", locale)}
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#1d1d1f]"
              >
                <ShoppingBag size={16} />
                {locale === "cn" ? "商城" : "Store"}
              </Link>
              <Link
                href={withLocale("/account", locale)}
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#1d1d1f]"
              >
                <UserRound size={16} />
                {locale === "cn" ? "客户中心" : "Account"}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        locale={locale}
      />
    </header>
  );
}

function MobileNavItem({
  item,
  locale,
  onClose,
}: {
  item: NavigationItem;
  locale: "cn" | "en";
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!item.columns.length) {
    return (
      <HeaderLink
        href={item.href}
        locale={locale}
        onClick={onClose}
        className="block border-b border-black/10 py-4 text-[24px] font-semibold leading-none"
      >
        {item.label}
      </HeaderLink>
    );
  }
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`mobile-navigation-${item.id}`}
        className="flex w-full items-center justify-between py-4 text-left text-[24px] font-semibold leading-none"
      >
        {item.label}
        <ChevronRight
          size={20}
          className={`transition duration-300 ${open ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={`mobile-navigation-${item.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden pb-4"
          >
            <HeaderLink
              href={item.href}
              locale={locale}
              onClick={onClose}
              className="mb-4 block text-sm font-semibold text-[#0071e3]"
            >
              {locale === "cn" ? `打开${item.label}` : `Open ${item.label}`}
            </HeaderLink>
            <div className="grid gap-5">
              {item.columns.map((column) => (
                <div key={`${item.id}-${column.eyebrow}`}>
                  <p className="mb-2 text-xs font-medium text-[#6e6e73]">
                    {column.eyebrow}
                  </p>
                  <div className="grid gap-2">
                    {column.links.map((link) => (
                      <HeaderLink
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        locale={locale}
                        onClick={onClose}
                        className="text-base font-semibold text-[#1d1d1f]"
                      >
                        {link.label}
                      </HeaderLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
