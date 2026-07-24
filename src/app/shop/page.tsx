"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LogIn,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageNotice, ResourceSection } from "@/components/PageBusinessBlocks";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import { useSiteContent } from "@/hooks/useSiteContent";
import type { LocalizedProduct as Product } from "@/lib/content-types";
import { customerFetch } from "@/lib/customer-fetch";
import { withLocale } from "@/lib/i18n";

type InventoryFilter = "all" | Product["inventoryStatus"];
type SortMode = "recommended" | "name" | "availability";
type CartLine = { productId: number; quantity: number };

const inventoryText = {
  cn: { in_stock: "可询价", preorder: "接受预订", out_of_stock: "暂不可订" },
  en: {
    in_stock: "Available",
    preorder: "Pre-order",
    out_of_stock: "Unavailable",
  },
} as const;

const availabilityRank: Record<Product["inventoryStatus"], number> = {
  in_stock: 0,
  preorder: 1,
  out_of_stock: 2,
};

export default function ShopPage() {
  const locale = useLocale();
  const content = useSiteContent(locale).shop;
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryFilter>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadedLocale, setLoadedLocale] = useState<"cn" | "en" | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [cartNotice, setCartNotice] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);
  const lastSavedCart = useRef("");
  const loading = loadedLocale !== locale;

  const copy =
    locale === "cn"
      ? {
          eyebrow: "BarryT 独立商城",
          title: "找到适合你的随身电力。",
          subtitle:
            "浏览在售产品、规格与供应状态，加入采购清单后一次提交询价。批量、定制和区域价格由销售确认。",
          browse: "浏览商城",
          bag: "采购清单",
          search: "搜索产品、SKU、颜色或容量",
          filter: "供应状态",
          all: "全部商品",
          sort: "商品排序",
          recommended: "推荐排序",
          name: "名称排序",
          availability: "供应优先",
          quote: "加入清单",
          added: "已加入",
          details: "查看详情",
          sku: "SKU",
          empty: "没有符合当前条件的商品。",
          loadError: "商城商品暂时无法加载，请稍后重试。",
          loading: "正在加载商城商品…",
          products: "件商城商品",
          available: "件可询价",
          support: "支持批量与定制",
          bagTitle: "你的采购清单",
          bagDescription: "调整数量后提交给销售，我们会确认价格、库存与交付条件。",
          emptyBag: "采购清单还是空的",
          emptyBagHint: "从商城选择商品后，它们会显示在这里。",
          continue: "继续浏览",
          remove: "移除",
          submit: "提交采购询价",
          disclaimer:
            "采购清单不是付款订单。最终价格、数量、运费、税费和交付时间以销售确认为准。",
          items: "件商品",
          statusAll: "全部状态",
          inStock: "可询价",
          preorder: "接受预订",
          unavailable: "暂不可订",
          loginToAdd: "登录后加入",
          authTitle: "登录后使用采购清单",
          authDescription:
            "采购清单会安全绑定到你的客户账号，可在电脑和手机上继续查看与修改。",
          login: "登录账户",
          register: "免费注册",
          saveError: "采购清单同步失败，请稍后重试。",
        }
      : {
          eyebrow: "BarryT independent store",
          title: "Find power that fits your day.",
          subtitle:
            "Browse available products, specifications, and supply status. Add products to one inquiry list for confirmed volume, custom, and regional pricing.",
          browse: "Browse store",
          bag: "Inquiry bag",
          search: "Search product, SKU, color, or capacity",
          filter: "Availability",
          all: "All products",
          sort: "Sort products",
          recommended: "Recommended",
          name: "Name",
          availability: "Availability",
          quote: "Add to bag",
          added: "Added",
          details: "View details",
          sku: "SKU",
          empty: "No products match the current filters.",
          loadError: "Store products are temporarily unavailable. Please try again.",
          loading: "Loading store products…",
          products: "store products",
          available: "available",
          support: "Volume and custom support",
          bagTitle: "Your inquiry bag",
          bagDescription:
            "Adjust quantities, then send the list to sales for pricing, stock, and delivery confirmation.",
          emptyBag: "Your inquiry bag is empty",
          emptyBagHint: "Products you choose in the store will appear here.",
          continue: "Continue shopping",
          remove: "Remove",
          submit: "Submit purchase inquiry",
          disclaimer:
            "This inquiry bag is not a payment order. Final price, quantity, freight, tax, and lead time are confirmed by sales.",
          items: "items",
          statusAll: "All availability",
          inStock: "Available",
          preorder: "Pre-order",
          unavailable: "Unavailable",
          loginToAdd: "Sign in to add",
          authTitle: "Sign in to use your inquiry bag",
          authDescription:
            "Your inquiry bag is securely tied to your account and stays available across desktop and mobile.",
          login: "Sign in",
          register: "Create account",
          saveError: "Your inquiry bag could not be synced. Please try again.",
        };

  useEffect(() => {
    let active = true;
    fetch(`/api/products?locale=${locale}&shop=true`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Products request failed with ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (active) {
          setProducts(Array.isArray(data.products) ? data.products : []);
          setLoadFailed(false);
          setLoadedLocale(locale);
        }
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setLoadFailed(true);
          setLoadedLocale(locale);
        }
      });
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    async function loadBag() {
      try {
        const sessionResponse = await customerFetch(
          "/api/customer/auth/session",
        );
        const session = await sessionResponse.json();
        if (!active) return;
        if (!session.authenticated) {
          setAuthenticated(false);
          setCart([]);
          return;
        }
        setAuthenticated(true);
        const bagResponse = await customerFetch("/api/customer/inquiry-bag");
        if (!bagResponse.ok) throw new Error("Inquiry bag load failed.");
        const bag = await bagResponse.json();
        let items = Array.isArray(bag.items)
          ? (bag.items as CartLine[])
          : [];
        try {
          const stored = window.localStorage.getItem("barryt-inquiry-bag");
          const legacy = stored
            ? (JSON.parse(stored) as CartLine[])
            : [];
          if (Array.isArray(legacy) && legacy.length) {
            const merged = new Map<number, number>();
            for (const item of [...items, ...legacy]) {
              if (
                Number.isInteger(item.productId) &&
                item.productId > 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
              )
                merged.set(
                  item.productId,
                  Math.min(999, (merged.get(item.productId) ?? 0) + item.quantity),
                );
            }
            const migration = await customerFetch(
              "/api/customer/inquiry-bag",
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: Array.from(merged, ([productId, quantity]) => ({
                    productId,
                    quantity,
                  })).slice(0, 50),
                }),
              },
            );
            if (migration.ok) {
              const migrated = await migration.json();
              items = Array.isArray(migrated.items) ? migrated.items : items;
              window.localStorage.removeItem("barryt-inquiry-bag");
            }
          }
        } catch {}
        if (active) {
          lastSavedCart.current = JSON.stringify(items);
          setCart(items);
        }
      } catch {
        if (active) {
          setAuthenticated(false);
          setCart([]);
          setCartNotice(copy.saveError);
        }
      } finally {
        if (active) setCartReady(true);
      }
    }
    void loadBag();
    return () => {
      active = false;
    };
  }, [copy.saveError]);

  useEffect(() => {
    if (!cartReady || authenticated !== true) return;
    const serialized = JSON.stringify(cart);
    if (serialized === lastSavedCart.current) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await customerFetch("/api/customer/inquiry-bag", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart }),
        });
        if (!response.ok) throw new Error("Inquiry bag save failed.");
        lastSavedCart.current = serialized;
        setCartNotice("");
      } catch {
        setCartNotice(copy.saveError);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authenticated, cart, cartReady, copy.saveError]);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cartOpen]);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return products
      .filter(
        (product) =>
          inventory === "all" || product.inventoryStatus === inventory,
      )
      .filter(
        (product) =>
          !value ||
          [product.name, product.color, product.capacity, product.sku].some(
            (field) => field.toLowerCase().includes(value),
          ),
      )
      .sort((left, right) => {
        if (sort === "name") return left.name.localeCompare(right.name);
        if (sort === "availability")
          return (
            availabilityRank[left.inventoryStatus] -
            availabilityRank[right.inventoryStatus]
          );
        return left.sortOrder - right.sortOrder;
      });
  }, [inventory, products, query, sort]);

  const cartProducts = useMemo(
    () =>
      cart
        .map((line) => {
          const product = products.find((item) => item.id === line.productId);
          return product ? { product, quantity: line.quantity } : null;
        })
        .filter(
          (
            item,
          ): item is {
            product: Product;
            quantity: number;
          } => item !== null,
        ),
    [cart, products],
  );
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const availableCount = products.filter(
    (product) => product.inventoryStatus !== "out_of_stock",
  ).length;
  const inquirySummary = cartProducts
    .map(
      ({ product, quantity }) =>
        `${quantity} × ${product.name} (${product.sku || `SZA-${product.id}`})`,
    )
    .join("\n");
  const inquiryHref = `${withLocale("/contact", locale)}?items=${encodeURIComponent(
    inquirySummary.slice(0, 1600),
  )}`;
  const returnToShop = withLocale("/shop", locale);
  const loginHref = `${withLocale("/account/login", locale)}?next=${encodeURIComponent(returnToShop)}`;
  const registerHref = `${withLocale("/account/register", locale)}?next=${encodeURIComponent(returnToShop)}`;

  const addToCart = (product: Product) => {
    if (product.inventoryStatus === "out_of_stock") return;
    if (authenticated !== true) {
      setAuthPromptOpen(true);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      return existing
        ? current.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: Math.min(999, item.quantity + 1) }
              : item,
          )
        : [...current, { productId: product.id, quantity: 1 }];
    });
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1300);
  };

  const setQuantity = (productId: number, quantity: number) =>
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.productId !== productId)
        : current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(999, quantity) }
              : item,
          ),
    );

  const openCart = () => {
    if (authenticated !== true) {
      setAuthPromptOpen(true);
      return;
    }
    setCartOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader />
      <Breadcrumbs
        locale={locale}
        items={[{ label: locale === "cn" ? "商城" : "Store" }]}
        className="border-b border-black/[0.06] bg-white"
      />
      <PageNotice content={content} />

      <section className="relative overflow-hidden border-b border-black/[0.06] bg-white px-5 pb-16 pt-20 sm:pb-24 sm:pt-28">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[-16rem] h-[36rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,113,227,0.16),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#0071e3]/15 bg-[#eef6ff] px-4 py-2 text-sm font-semibold text-[#0071e3]"
          >
            <ShoppingBag size={16} aria-hidden="true" />
            {content.eyebrow || copy.eyebrow}
          </motion.div>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.58,
              delay: reduceMotion ? 0 : 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-6 max-w-4xl text-balance text-[46px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[76px]"
          >
            {content.title || copy.title}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.52,
              delay: reduceMotion ? 0 : 0.12,
            }}
            className="mt-6 max-w-2xl text-[18px] leading-8 text-[#6e6e73] sm:text-[21px]"
          >
            {content.subtitle || copy.subtitle}
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.48,
              delay: reduceMotion ? 0 : 0.18,
            }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="#store-products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 font-semibold text-white transition hover:bg-[#0077ed]"
            >
              {copy.browse}
              <ArrowRight size={17} />
            </a>
            <button
              type="button"
              onClick={openCart}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 font-semibold transition hover:bg-[#f5f5f7]"
            >
              <ShoppingBag size={17} />
              {copy.bag}
              {cartCount ? (
                <span className="grid min-w-6 place-items-center rounded-full bg-[#1d1d1f] px-1.5 py-0.5 text-xs text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </motion.div>

          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: PackageCheck,
                value: loading ? "—" : products.length,
                label: copy.products,
              },
              {
                icon: Truck,
                value: loading ? "—" : availableCount,
                label: copy.available,
              },
              {
                icon: Sparkles,
                value: "OEM",
                label: copy.support,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.4,
                    delay: reduceMotion ? 0 : 0.22 + index * 0.05,
                  }}
                  className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-[#fbfbfd]/90 p-4"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-white text-[#0071e3] shadow-sm">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xl font-semibold">{item.value}</p>
                    <p className="mt-0.5 text-sm text-[#6e6e73]">
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="store-products" className="scroll-mt-16 px-5 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-black/[0.06] bg-white/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:sticky sm:top-12 sm:z-20 sm:p-4">
            <div className="grid gap-2 sm:gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
              <label className="relative block">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6e6e73]"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={content.labels?.search || copy.search}
                  aria-label={copy.search}
                  className="min-h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] pl-11 pr-4 text-sm outline-none transition focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10 sm:min-h-12"
                />
              </label>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 lg:contents">
                <label className="relative min-w-0">
                  <span className="sr-only">{copy.filter}</span>
                  <SlidersHorizontal
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73]"
                  />
                  <select
                    value={inventory}
                    onChange={(event) =>
                      setInventory(event.target.value as InventoryFilter)
                    }
                    aria-label={copy.filter}
                    className="min-h-11 w-full min-w-0 appearance-none truncate rounded-xl border border-black/10 bg-white pl-8 pr-7 text-xs font-medium outline-none focus:border-[#0071e3] sm:min-h-12 sm:min-w-40 sm:pl-9 sm:pr-9 sm:text-sm"
                  >
                    <option value="all">{copy.statusAll}</option>
                    <option value="in_stock">{copy.inStock}</option>
                    <option value="preorder">{copy.preorder}</option>
                    <option value="out_of_stock">{copy.unavailable}</option>
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e6e73]"
                  />
                </label>
                <label className="relative min-w-0">
                  <span className="sr-only">{copy.sort}</span>
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as SortMode)
                    }
                    aria-label={copy.sort}
                    className="min-h-11 w-full min-w-0 appearance-none truncate rounded-xl border border-black/10 bg-white pl-3 pr-7 text-xs font-medium outline-none focus:border-[#0071e3] sm:min-h-12 sm:min-w-36 sm:pl-4 sm:pr-9 sm:text-sm"
                  >
                    <option value="recommended">{copy.recommended}</option>
                    <option value="name">{copy.name}</option>
                    <option value="availability">{copy.availability}</option>
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e6e73]"
                  />
                </label>
                <button
                  type="button"
                  onClick={openCart}
                  aria-label={`${copy.bag}，${cartCount} ${copy.items}`}
                  className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl bg-[#1d1d1f] px-3 text-xs font-semibold text-white transition hover:bg-[#333336] sm:min-h-12 sm:px-5 sm:text-sm"
                >
                  <ShoppingBag size={17} />
                  <span className="hidden min-[360px]:inline sm:hidden">
                    {locale === "cn" ? "清单" : "Bag"}
                  </span>
                  <span className="hidden sm:inline">{copy.bag}</span>
                  {cartCount ? (
                    <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[#0071e3] px-1 text-[10px] leading-5 text-white sm:static sm:bg-white sm:text-xs sm:leading-normal sm:text-[#1d1d1f]">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <p className="text-sm text-[#6e6e73]" aria-live="polite">
              {loading ? copy.loading : `${visible.length} ${copy.products}`}
            </p>
            {(query || inventory !== "all") && !loading ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setInventory("all");
                }}
                className="text-sm font-semibold text-[#0071e3] hover:underline"
              >
                {locale === "cn" ? "清除筛选" : "Clear filters"}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-[480px] animate-pulse rounded-[24px] bg-white"
                />
              ))}
            </div>
          ) : visible.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product, index) => (
                <motion.article
                  key={product.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -5 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.38,
                    delay: reduceMotion ? 0 : Math.min(index * 0.045, 0.24),
                    ease: [0.22, 1, 0.36, 1],
                    layout: { duration: reduceMotion ? 0 : 0.25 },
                  }}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_10px_32px_rgba(0,0,0,0.05)]"
                >
                  <Link
                    href={withLocale(`/products/${product.slug}`, locale)}
                    className="relative block aspect-[4/3] overflow-hidden bg-[#fbfbfd]"
                  >
                    {product.video ? (
                      <video
                        src={product.video}
                        poster={product.image}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                      />
                    ) : (
                      <Image
                        unoptimized
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width:1280px) 30vw, (min-width:640px) 46vw, 94vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.035]"
                      />
                    )}
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                        product.inventoryStatus === "out_of_stock"
                          ? "bg-white/90 text-[#6e6e73]"
                          : product.inventoryStatus === "preorder"
                            ? "bg-amber-50/95 text-amber-800"
                            : "bg-emerald-50/95 text-emerald-800"
                      }`}
                    >
                      {inventoryText[locale][product.inventoryStatus]}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-medium text-[#86868b]">
                      {copy.sku}: {product.sku || `SZA-${product.id}`}
                    </p>
                    <h2 className="mt-2 truncate text-[22px] font-semibold tracking-[-0.02em]">
                      {product.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#6e6e73]">
                      {product.subtitle}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#515154]">
                      {product.capacity ? (
                        <span className="rounded-full bg-[#f5f5f7] px-3 py-1.5">
                          {product.capacity}
                        </span>
                      ) : null}
                      {product.color ? (
                        <span className="rounded-full bg-[#f5f5f7] px-3 py-1.5">
                          {product.color}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5 flex items-baseline gap-2">
                      <p className="text-2xl font-semibold">
                        {product.price ||
                          (locale === "cn" ? "联系询价" : "Contact for price")}
                      </p>
                      {product.compareAtPrice ? (
                        <p className="text-sm text-[#86868b] line-through">
                          {product.compareAtPrice}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-6 grid grid-cols-[1fr_1.2fr] gap-2">
                      <Link
                        href={withLocale(`/products/${product.slug}`, locale)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-black/10 px-3 text-sm font-semibold transition hover:bg-[#f5f5f7]"
                      >
                        {copy.details}
                      </Link>
                      <button
                        type="button"
                        disabled={
                          product.inventoryStatus === "out_of_stock"
                        }
                        onClick={() => addToCart(product)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-3 text-sm font-semibold text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#d2d2d7]"
                      >
                        {addedId === product.id ? (
                          <>
                            <Check size={16} />
                            {copy.added}
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={16} />
                            {authenticated === true
                              ? copy.quote
                              : copy.loginToAdd}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-black/10 bg-white py-20 text-center text-[#6e6e73]">
              {loadFailed ? copy.loadError : copy.empty}
            </div>
          )}
        </div>
      </section>

      <ResourceSection content={content} locale={locale} />
      <SiteFooter />

      <AnimatePresence>
        {authPromptOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/40 px-5 backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={copy.authTitle}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setAuthPromptOpen(false)}
              aria-label={locale === "cn" ? "关闭登录提示" : "Close sign-in prompt"}
            />
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              transition={{ duration: reduceMotion ? 0 : 0.28 }}
              className="relative w-full max-w-md rounded-[26px] bg-white p-7 shadow-2xl sm:p-9"
            >
              <button
                type="button"
                onClick={() => setAuthPromptOpen(false)}
                className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-[#f5f5f7]"
                aria-label={locale === "cn" ? "关闭" : "Close"}
              >
                <X size={17} />
              </button>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eef6ff] text-[#0071e3]">
                <LockKeyhole size={22} />
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.025em]">
                {copy.authTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6e6e73]">
                {copy.authDescription}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href={loginHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-5 text-sm font-semibold text-white"
                >
                  <LogIn size={16} />
                  {copy.login}
                </Link>
                <Link
                  href={registerHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-black/10 px-5 text-sm font-semibold"
                >
                  {copy.register}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={copy.bagTitle}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setCartOpen(false)}
              aria-label={locale === "cn" ? "关闭采购清单" : "Close inquiry bag"}
            />
            <motion.aside
              initial={reduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: "100%" }}
              transition={{
                duration: reduceMotion ? 0 : 0.36,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-y-0 right-0 flex min-h-0 w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl"
            >
              <header className="flex shrink-0 items-start justify-between border-b border-black/[0.06] p-5 sm:p-6">
                <div>
                  <p className="text-sm font-semibold text-[#0071e3]">
                    {copy.bag}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {copy.bagTitle}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#6e6e73]">
                    {copy.bagDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f5f5f7]"
                  aria-label={
                    locale === "cn" ? "关闭采购清单" : "Close inquiry bag"
                  }
                >
                  <X size={18} />
                </button>
              </header>

              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6"
                tabIndex={0}
                aria-label={
                  locale === "cn"
                    ? "采购清单商品，可上下滑动"
                    : "Inquiry bag products, scroll vertically"
                }
              >
                {cartNotice ? (
                  <p
                    role="status"
                    className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    {cartNotice}
                  </p>
                ) : null}
                {cartProducts.length ? (
                  <div className="grid gap-4">
                    {cartProducts.map(({ product, quantity }) => (
                      <article
                        key={product.id}
                        className="grid grid-cols-[84px_1fr] gap-4 rounded-2xl border border-black/[0.07] p-3"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f5f5f7]">
                          <Image
                            unoptimized
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="84px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold">
                                {product.name}
                              </h3>
                              <p className="mt-1 text-xs text-[#86868b]">
                                {product.sku || `SZA-${product.id}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setQuantity(product.id, 0)}
                              className="text-xs font-semibold text-[#6e6e73] hover:text-[#d70015]"
                            >
                              {copy.remove}
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-semibold">
                            {product.price}
                          </p>
                          <div
                            className="mt-3 inline-flex items-center rounded-full border border-black/10"
                            aria-label={`${product.name} ${locale === "cn" ? "数量" : "quantity"}`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(product.id, quantity - 1)
                              }
                              className="grid size-9 place-items-center"
                              aria-label={
                                locale === "cn" ? "减少数量" : "Decrease quantity"
                              }
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-9 text-center text-sm font-semibold">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(product.id, quantity + 1)
                              }
                              className="grid size-9 place-items-center"
                              aria-label={
                                locale === "cn" ? "增加数量" : "Increase quantity"
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="grid h-full min-h-80 place-items-center text-center">
                    <div>
                      <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#eef6ff] text-[#0071e3]">
                        <ShoppingBag size={27} />
                      </span>
                      <h3 className="mt-5 text-xl font-semibold">
                        {copy.emptyBag}
                      </h3>
                      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#6e6e73]">
                        {copy.emptyBagHint}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCartOpen(false)}
                        className="mt-5 min-h-11 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white"
                      >
                        {copy.continue}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {cartProducts.length ? (
                <footer className="shrink-0 border-t border-black/[0.06] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6e6e73]">
                      {copy.bag}
                    </span>
                    <span className="font-semibold">
                      {cartCount} {copy.items}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#86868b]">
                    {copy.disclaimer}
                  </p>
                  <Link
                    href={inquiryHref}
                    onClick={() => setCartOpen(false)}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 font-semibold text-white transition hover:bg-[#0077ed]"
                  >
                    {copy.submit}
                    <ArrowRight size={17} />
                  </Link>
                </footer>
              ) : null}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <span className="sr-only" aria-live="polite">
        {addedId
          ? locale === "cn"
            ? "商品已加入采购清单"
            : "Product added to inquiry bag"
          : ""}
      </span>
    </main>
  );
}
