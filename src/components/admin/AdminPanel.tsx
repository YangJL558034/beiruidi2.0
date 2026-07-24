"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Archive,
  Boxes,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe2,
  Headphones,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  PanelTop,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import type {
  AdminRole,
  DashboardStats,
  FooterContent,
  Inquiry,
  PageMedia,
  Post,
  Product,
  SiteContent,
  SiteContentSection,
} from "@/lib/content-types";
import type { Locale, NavigationConfig } from "@/lib/navigation";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminOperations } from "@/components/admin/AdminOperations";
import { VisualContentManager } from "@/components/admin/VisualContentManager";
import { SupportDesk } from "@/components/admin/SupportDesk";
import { canAccessAdminModule, type AdminModuleId } from "@/lib/admin-access";

type Tab = AdminModuleId;
type Modal =
  | "product"
  | "post"
  | "brand"
  | "page"
  | "footer"
  | "navigation"
  | "backup"
  | null;
type Props = {
  initialStats: DashboardStats;
  initialProducts: Product[];
  initialPosts: Post[];
  initialInquiries: Inquiry[];
  initialNavigation: Record<Locale, NavigationConfig>;
  initialContent: Record<Locale, SiteContent>;
  initialFooter: Record<Locale, FooterContent>;
};
const images = [
  "/products/web/power-stack-blue.webp",
  "/products/web/power-stack-pink-vertical.webp",
  "/products/web/power-stack-orange.webp",
  "/products/web/power-stack-pink.webp",
  "/products/web/power-bank-orange.webp",
];
const emptyProduct: Partial<Product> = {
  name: "",
  nameCn: "",
  slug: "",
  subtitle: "",
  subtitleCn: "",
  description: "",
  descriptionCn: "",
  color: "",
  colorCn: "",
  capacity: "Compact mobile power",
  capacityCn: "便携移动电源",
  input: "USB-C",
  output: "USB-C",
  price: "Contact us",
  priceCn: "联系咨询",
  compareAtPrice: "",
  compareAtPriceCn: "",
  sku: "",
  shopEnabled: true,
  inventoryStatus: "in_stock",
  video: "",
  image: images[0],
  images: [images[0]],
  featured: false,
  sortOrder: 100,
  status: "published",
};
const emptyPost: Partial<Post> = {
  title: "",
  titleCn: "",
  slug: "",
  excerpt: "",
  excerptCn: "",
  content: "",
  contentCn: "",
  category: "News",
  categoryCn: "资讯",
  image: images[0],
  status: "published",
  publishedAt: new Date().toISOString().slice(0, 10),
};
const tabs: Array<{
  id: Tab;
  label: string;
  group: "概览" | "销售渠道" | "内容运营" | "网站渠道" | "系统管理";
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "业务概览", group: "概览", icon: LayoutDashboard },
  { id: "shop", label: "商城管理", group: "销售渠道", icon: ShoppingBag },
  { id: "products", label: "产品目录", group: "销售渠道", icon: Boxes },
  {
    id: "inquiries",
    label: "客户询盘",
    group: "销售渠道",
    icon: MessageSquare,
  },
  {
    id: "supportDesk",
    label: "在线客服",
    group: "销售渠道",
    icon: Headphones,
  },
  { id: "content", label: "页面内容", group: "内容运营", icon: PanelTop },
  { id: "posts", label: "资讯内容", group: "内容运营", icon: FileText },
  { id: "navigation", label: "导航菜单", group: "网站渠道", icon: Menu },
  { id: "footer", label: "页脚设置", group: "网站渠道", icon: Globe2 },
  {
    id: "brand",
    label: "品牌与登录注册图",
    group: "网站渠道",
    icon: ImageIcon,
  },
  { id: "operations", label: "运维中心", group: "系统管理", icon: Activity },
  { id: "system", label: "系统设置", group: "系统管理", icon: Settings },
];
const tabGroups = [
  "概览",
  "销售渠道",
  "内容运营",
  "网站渠道",
  "系统管理",
] as const;

const pageNames: Record<keyof SiteContent, string> = {
  home: "首页",
  products: "全部产品页",
  shop: "独立商城",
  services: "服务页",
  cases: "合作场景",
  faq: "FAQ",
  news: "用户评价",
  about: "关于我们",
  support: "支持页面",
  contact: "联系页面",
  privacy: "隐私政策",
  terms: "使用条款",
};
const fields =
  "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const textareas = `${fields} min-h-28 py-2 resize-y`;
function Label({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Button({
  children,
  onClick,
  kind = "primary",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "soft" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const color =
    kind === "primary"
      ? "bg-[#2f6df6] text-white hover:bg-[#245edc]"
      : kind === "danger"
        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:opacity-60 ${color}`}
    >
      {children}
    </button>
  );
}

export function AdminPanel({
  initialStats,
  initialProducts,
  initialPosts,
  initialInquiries,
  initialNavigation,
  initialContent,
  initialFooter,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("cn");
  const [role, setRole] = useState<AdminRole>("owner");
  const [products, setProducts] = useState(initialProducts);
  const [posts, setPosts] = useState(initialPosts);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [content, setContent] = useState(initialContent);
  const [footer, setFooter] = useState(initialFooter);
  const [navigation, setNavigation] = useState(initialNavigation);
  const [product, setProduct] = useState<Partial<Product>>(emptyProduct);
  const [post, setPost] = useState<Partial<Post>>(emptyPost);
  const [pageKey] = useState<keyof SiteContent>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [contentInitialPage, setContentInitialPage] =
    useState<keyof SiteContent>("home");
  const [system, setSystem] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void adminFetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => {
        if (data.mustChangePassword) {
          window.location.replace("/admin/change-password");
          return;
        }
        if (
          data.role === "editor" ||
          data.role === "support" ||
          data.role === "sales" ||
          data.role === "owner"
        )
          setRole(data.role);
      })
      .catch(() => undefined);
  }, []);
  const visibleTabs = tabs.filter((item) =>
    canAccessAdminModule(role, item.id),
  );
  const stats = useMemo(
    () => ({
      ...initialStats,
      products: products.length,
      posts: posts.length,
      newInquiries: inquiries.filter((item) => item.status === "new").length,
      publishedProducts: products.filter((item) => item.status === "published")
        .length,
    }),
    [initialStats, inquiries, posts, products],
  );
  const announce = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }, []);
  async function request(url: string, method = "GET", body?: unknown) {
    const response = await adminFetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => null))?.error ??
          "保存失败，请重试。",
      );
    return response.json();
  }
  async function saveProduct() {
    setBusy(true);
    try {
      await request(
        "/api/admin/products",
        product.id ? "PUT" : "POST",
        product,
      );
      const data = await request("/api/admin/products");
      setProducts(data.products);
      setModal(null);
      announce("产品已保存，前台会立即更新。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function savePost() {
    setBusy(true);
    try {
      await request("/api/admin/posts", post.id ? "PUT" : "POST", post);
      const data = await request("/api/admin/posts");
      setPosts(data.posts);
      setModal(null);
      announce("资讯已保存，前台会立即更新。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: "products" | "posts", id: number) {
    if (!window.confirm("确认删除这条内容吗？此操作无法撤销。")) return;
    try {
      await request(`/api/admin/${kind}?id=${id}`, "DELETE");
      if (kind === "products")
        setProducts((items) => items.filter((item) => item.id !== id));
      else setPosts((items) => items.filter((item) => item.id !== id));
      announce("已删除。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "删除失败");
    }
  }
  async function saveContent() {
    setBusy(true);
    try {
      const data = await request("/api/admin/site-content", "PUT", {
        locale,
        content: content[locale],
      });
      setContent((current) => ({ ...current, [locale]: data.content }));
      setModal(null);
      announce("页面内容已发布。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function saveFooter() {
    setBusy(true);
    try {
      const data = await request("/api/admin/footer", "PUT", {
        locale,
        content: footer[locale],
      });
      setFooter((current) => ({ ...current, [locale]: data.content }));
      setModal(null);
      announce("网站底部已更新。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function saveNavigation() {
    setBusy(true);
    try {
      const data = await request("/api/admin/navigation", "PUT", {
        locale,
        navigation: navigation[locale],
      });
      setNavigation((current) => ({ ...current, [locale]: data.navigation }));
      setModal(null);
      announce("顶部导航已更新。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function updateInquiry(id: number, status: Inquiry["status"]) {
    try {
      const data = await request("/api/admin/inquiries", "PATCH", {
        id,
        status,
      });
      setInquiries((items) =>
        items.map((item) => (item.id === id ? data.inquiry : item)),
      );
      announce("客户状态已更新。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "更新失败");
    }
  }
  async function loadSystem() {
    if (system) return;
    try {
      const data = await request("/api/admin/system");
      setSystem(data.settings);
    } catch {
      announce("无法读取系统设置。");
    }
  }
  async function saveSystem() {
    try {
      const data = await request("/api/admin/system", "PUT", system);
      setSystem(data.settings);
      announce("系统设置已保存。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    }
  }
  async function saveBrand() {
    setBusy(true);
    try {
      const data = await request("/api/admin/system", "PUT", system);
      setSystem(data.settings);
      setModal(null);
      announce("品牌、Logo 和客户登录注册图片已更新，前台会立即同步。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await adminFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  function selectTab(next: Tab) {
    if (tab === "content" && next !== "content" && contentDirty) {
      announce("草稿正在自动保存，请稍候再离开页面内容。");
      return;
    }
    if (!canAccessAdminModule(role, next)) {
      announce("当前账号没有此功能的操作权限。");
      return;
    }
    setTab(next);
    setMobileOpen(false);
    if (next === "system" || next === "brand") loadSystem();
  }
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[248px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[248px] overflow-y-auto bg-[#111b31] p-4 pb-24 text-white transition lg:static ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="flex h-14 items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-md bg-[#2f6df6] font-bold">
              S
            </div>
            <div>
              <p className="text-sm font-bold">SZA POWER</p>
              <p className="text-xs text-white/55">内容管理系统</p>
            </div>
          </div>
          <nav className="mt-7 grid gap-5">
            {tabGroups.map((group) => {
              const items = visibleTabs.filter((item) => item.group === group);
              if (!items.length) return null;
              return (
                <div key={group} className="grid gap-1">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-white/35">
                    {group}
                  </p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item.id)}
                        className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${tab === item.id ? "bg-[#2f6df6] text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Icon size={17} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <Button kind="soft" onClick={logout}>
              <LogOut size={16} />
              退出登录
            </Button>
          </div>
        </aside>
        <section className="min-w-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-7">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="grid size-10 place-items-center rounded-md bg-slate-100 lg:hidden"
              >
                <Menu size={19} />
              </button>
              <div>
                <p className="text-sm font-semibold">
                  {tabs.find((item) => item.id === tab)?.label}
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  管理前台内容、客户咨询与网站设置
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}`}
                target="_blank"
                className="hidden min-h-10 items-center rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-700 sm:inline-flex"
              >
                查看网站
              </Link>
              <Button
                kind="soft"
                disabled={tab === "content" && contentDirty}
                onClick={() => {
                  if (tab === "content" && contentDirty) {
                    announce("草稿正在自动保存，请稍候再切换语言。");
                    return;
                  }
                  setLocale((value) => (value === "cn" ? "en" : "cn"));
                }}
              >
                {locale === "cn" ? "中文" : "EN"}
              </Button>
            </div>
          </header>
          <div
            className={`mx-auto w-full max-w-[1440px] p-4 sm:p-7 ${
              tab === "content" || tab === "supportDesk"
                ? "lg:h-[calc(100dvh-4rem)] lg:overflow-hidden"
                : "lg:flex-1 lg:overflow-y-auto"
            }`}
          >
            {notice ? (
              <div className="mb-5 flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                {notice}
                <button onClick={() => setNotice("")}>
                  <X size={16} />
                </button>
              </div>
            ) : null}
            {tab === "overview" && (
              <Overview
                stats={stats}
                onTab={selectTab}
                onAddProduct={() => {
                  setProduct(emptyProduct);
                  setModal("product");
                }}
                onAddPost={() => {
                  setPost(emptyPost);
                  setModal("post");
                }}
                onOpenContentPage={(page) => {
                  setContentInitialPage(page);
                  selectTab("content");
                }}
              />
            )}
            {tab === "content" && (
              <VisualContentManager
                key={`${locale}-${contentInitialPage}`}
                locale={locale}
                role={role}
                initialContent={content[locale]}
                initialPage={contentInitialPage}
                onPublished={(published) =>
                  setContent((current) => ({
                    ...current,
                    [locale]: published,
                  }))
                }
                onOpenArea={(area) => selectTab(area)}
                announce={announce}
                onDirtyChange={setContentDirty}
              />
            )}{" "}
            {tab === "brand" && (
              <BrandView system={system} onEdit={() => setModal("brand")} />
            )}{" "}
            {tab === "navigation" && (
              <NavigationView
                config={navigation[locale]}
                onEdit={() => setModal("navigation")}
              />
            )}{" "}
            {tab === "footer" && (
              <FooterView
                footer={footer[locale]}
                onEdit={() => setModal("footer")}
              />
            )}{" "}
            {tab === "products" && (
              <ProductsView
                products={products}
                onAdd={() => {
                  setProduct(emptyProduct);
                  setModal("product");
                }}
                onEdit={(item) => {
                  setProduct(item);
                  setModal("product");
                }}
                onDelete={(id) => remove("products", id)}
              />
            )}{" "}
            {tab === "shop" && (
              <ShopView
                products={products}
                onAdd={() => {
                  setProduct(emptyProduct);
                  setModal("product");
                }}
                onEdit={(item) => {
                  setProduct(item);
                  setModal("product");
                }}
              />
            )}{" "}
            {tab === "posts" && (
              <PostsView
                posts={posts}
                onAdd={() => {
                  setPost(emptyPost);
                  setModal("post");
                }}
                onEdit={(item) => {
                  setPost(item);
                  setModal("post");
                }}
                onDelete={(id) => remove("posts", id)}
              />
            )}{" "}
            {tab === "inquiries" && (
              <InquiriesView inquiries={inquiries} onUpdate={updateInquiry} />
            )}{" "}
            {tab === "supportDesk" && (
              <SupportDesk role={role} announce={announce} />
            )}{" "}
            {tab === "operations" && <AdminOperations />}{" "}
            {tab === "system" && (
              <SystemView
                system={system}
                setSystem={setSystem}
                onSave={saveSystem}
                onBackup={() => setModal("backup")}
              />
            )}
          </div>
        </section>
      </div>
      {modal ? (
        <ModalShell
          title={
            modal === "product"
              ? product.id
                ? "编辑产品"
                : "新增产品"
              : modal === "post"
                ? post.id
                  ? "编辑资讯"
                  : "新增资讯"
                : modal === "brand"
                  ? "编辑品牌与登录注册图"
                  : modal === "page"
                    ? `编辑${pageNames[pageKey]}`
                    : modal === "footer"
                      ? "编辑网站底部"
                      : modal === "navigation"
                        ? "编辑顶部导航"
                        : "数据库备份"
          }
          onClose={() => setModal(null)}
        >
          {modal === "product" ? (
            <ProductEditor
              value={product}
              setValue={setProduct}
              onSave={saveProduct}
              busy={busy}
            />
          ) : modal === "post" ? (
            <PostEditor
              value={post}
              setValue={setPost}
              onSave={savePost}
              busy={busy}
            />
          ) : modal === "brand" ? (
            <BrandEditor
              system={system}
              setSystem={setSystem}
              onSave={saveBrand}
              busy={busy}
            />
          ) : modal === "page" ? (
            <PageEditor
              pageKey={pageKey}
              value={content[locale][pageKey]}
              onChange={(value) =>
                setContent((current) => ({
                  ...current,
                  [locale]: { ...current[locale], [pageKey]: value },
                }))
              }
              onSave={saveContent}
              busy={busy}
            />
          ) : modal === "footer" ? (
            <FooterEditor
              value={footer[locale]}
              onChange={(value) =>
                setFooter((current) => ({ ...current, [locale]: value }))
              }
              onSave={saveFooter}
              busy={busy}
            />
          ) : modal === "navigation" ? (
            <NavigationEditor
              value={navigation[locale]}
              onChange={(value) =>
                setNavigation((current) => ({ ...current, [locale]: value }))
              }
              onSave={saveNavigation}
              busy={busy}
            />
          ) : (
            <BackupPanel onClose={() => setModal(null)} announce={announce} />
          )}
        </ModalShell>
      ) : null}
    </main>
  );
}

function Overview({
  stats,
  onTab,
  onAddProduct,
  onAddPost,
  onOpenContentPage,
}: {
  stats: DashboardStats;
  onTab: (tab: Tab) => void;
  onAddProduct: () => void;
  onAddPost: () => void;
  onOpenContentPage: (page: keyof SiteContent) => void;
}) {
  const cards = [
    {
      label: "产品",
      value: stats.products,
      icon: Boxes,
      tab: "products" as Tab,
    },
    {
      label: "已发布产品",
      value: stats.publishedProducts,
      icon: Globe2,
      tab: "products" as Tab,
    },
    { label: "资讯", value: stats.posts, icon: FileText, tab: "posts" as Tab },
    {
      label: "待处理留言",
      value: stats.newInquiries,
      icon: Mail,
      tab: "inquiries" as Tab,
    },
  ];
  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-[#111b31] p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-white/60">欢迎回来</p>
          <h1 className="mt-1 text-2xl font-semibold">SZA POWER 内容工作台</h1>
          <p className="mt-2 text-sm text-white/70">
            从这里可以快速更新网站、查看客户咨询和维护系统。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAddProduct}>
            <Plus size={16} />
            新增产品
          </Button>
          <Button kind="soft" onClick={onAddPost}>
            <Plus size={16} />
            新增资讯
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onTab(card.tab)}
              className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200"
            >
              <Icon size={20} className="text-[#2f6df6]" />
              <p className="mt-7 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-slate-500">{card.label}</p>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Quick
          title="快速编辑"
          items={["登录/注册图片", "合作场景", "顶部导航", "网站底部"]}
          onClick={(value) => {
            if (value === "合作场景") {
              onOpenContentPage("cases");
              return;
            }
            onTab(
              value === "登录/注册图片"
                ? "brand"
                : value === "顶部导航"
                  ? "navigation"
                  : "footer",
            );
          }}
        />
        <Quick
          title="安全与运营"
          items={["查看客户留言", "创建数据库备份", "管理员账户", "密码找回"]}
          onClick={(value) =>
            onTab(value === "查看客户留言" ? "inquiries" : "system")
          }
        />
      </div>
    </div>
  );
}
function Quick({
  title,
  items,
  onClick,
}: {
  title: string;
  items: string[];
  onClick: (item: string) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 grid">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onClick(item)}
            className="flex min-h-11 items-center justify-between border-b border-slate-100 text-left text-sm text-slate-600 last:border-0 hover:text-blue-600"
          >
            {item}
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}
/** @deprecated Kept as a compatibility export for older embedded admin links. */
export function ContentIndex({
  content,
  locale,
  onEdit,
  onTab,
}: {
  content: SiteContent;
  locale: Locale;
  onEdit: (key: keyof SiteContent) => void;
  onTab: (tab: Tab) => void;
}) {
  const prefix = locale === "cn" ? "/cn" : "/en";
  const pages: Array<{
    key: keyof SiteContent;
    name: string;
    path: string;
    description: string;
  }> = [
    {
      key: "home",
      name: "首页",
      path: prefix,
      description:
        "首屏标题、两个按钮、图片/视频，以及下方其他主视觉和 6 个产品展示卡片（名称、文案和图片从“产品管理”自动同步）",
    },
    {
      key: "products",
      name: "全部产品页",
      path: `${prefix}/products`,
      description: "页面标题、简介、按钮、横幅图片或视频",
    },
    {
      key: "shop",
      name: "独立商城",
      path: `${prefix}/shop`,
      description: "商城标题、采购说明、公告、报价入口和补充内容区",
    },
    {
      key: "news",
      name: "资讯中心",
      path: `${prefix}/news`,
      description: "页面标题、简介、按钮、横幅图片或视频",
    },
    {
      key: "support",
      name: "支持页面",
      path: `${prefix}/support`,
      description:
        "页面标题、按钮、图片/视频，以及充电基础、电池保养、保修支持、分销支持四个内容区",
    },
    {
      key: "about",
      name: "关于我们",
      path: `${prefix}/about`,
      description:
        "页面标题、按钮、图片/视频，以及公司介绍、产品理念、国际合作三个内容区",
    },
    {
      key: "contact",
      name: "联系页面",
      path: `${prefix}/contact`,
      description:
        "页面标题、简介、按钮和媒体；邮箱、地区在系统设置 → 前台联系信息",
    },
    {
      key: "privacy",
      name: "隐私政策",
      path: `${prefix}/privacy`,
      description: "政策页标题、说明、全部政策条款、图片/视频和按钮",
    },
    {
      key: "terms",
      name: "使用条款",
      path: `${prefix}/terms`,
      description: "条款页标题、说明、全部使用条款、图片/视频和按钮",
    },
  ];
  const globalAreas = [
    {
      title: "品牌名称与 Logo",
      description: "顶部 Logo、网站全名、顶部简称和 Logo 说明文字",
      tab: "brand" as Tab,
      icon: ImageIcon,
    },
    {
      title: "顶部导航",
      description: "产品、资讯、支持、关于、联系等菜单和展开链接",
      tab: "navigation" as Tab,
      icon: Menu,
    },
    {
      title: "网站底部",
      description: "底部声明、栏目、链接、版权和快捷链接",
      tab: "footer" as Tab,
      icon: Globe2,
    },
    {
      title: "联系信息",
      description: "联系页邮箱、地区说明和合作说明文字",
      tab: "system" as Tab,
      icon: MessageSquare,
    },
  ];
  return (
    <section className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">前台页面修改目录</h1>
        <p className="mt-1 text-sm text-slate-500">
          当前编辑：{locale === "cn" ? "中文站（/cn）" : "英文站（/en）"}
          。每张卡片都写明对应前台位置和可修改内容。
        </p>
      </div>
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-900">
          你截图中的“公司介绍 / 产品理念 / 国际合作”
        </h2>
        <p className="mt-2 text-sm leading-6 text-blue-800">
          菜单名称和跳转地址：进入“顶部导航”修改；“公司介绍、产品理念、国际合作”的页面正文：进入“关于我们”修改；国际合作若跳转到联系页，联系页标题和介绍在“联系页面”，邮箱和地区在“系统设置
          → 前台联系信息”。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button kind="soft" onClick={() => onTab("navigation")}>
            <Pencil size={15} />
            修改这些菜单
          </Button>
          <Button kind="soft" onClick={() => onEdit("about")}>
            <Pencil size={15} />
            修改关于页三个内容区
          </Button>
          <Button kind="soft" onClick={() => onEdit("contact")}>
            <Pencil size={15} />
            修改联系页面
          </Button>
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          全站公共区域
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {globalAreas.map((area) => {
            const Icon = area.icon;
            return (
              <article
                key={area.title}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <Icon size={21} className="text-blue-600" />
                <h3 className="mt-5 font-semibold">{area.title}</h3>
                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                  {area.description}
                </p>
                <div className="mt-4">
                  <Button kind="soft" onClick={() => onTab(area.tab)}>
                    <Pencil size={15} />
                    进入修改
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">主要页面</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <article
              key={page.key}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-600">
                    {page.path}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{page.name}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                  {content[page.key].media?.type === "video" ? "视频" : "图片"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                可修改：{page.description}
              </p>
              <p className="mt-3 line-clamp-2 min-h-10 text-sm font-medium text-slate-700">
                {content[page.key].title}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button kind="soft" onClick={() => onEdit(page.key)}>
                  <Pencil size={15} />
                  修改{page.name}
                </Button>
                <Link
                  href={page.path}
                  target="_blank"
                  className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-blue-600"
                >
                  查看前台
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          列表与详情内容
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Boxes size={21} className="text-blue-600" />
            <h3 className="mt-5 font-semibold">产品卡片与产品详情</h3>
            <p className="mt-2 text-sm text-slate-500">
              名称、颜色、容量、价格、图片、介绍和排序统一在“产品管理”修改。
            </p>
            <div className="mt-4">
              <Button kind="soft" onClick={() => onTab("products")}>
                <Pencil size={15} />
                进入产品管理
              </Button>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <FileText size={21} className="text-blue-600" />
            <h3 className="mt-5 font-semibold">资讯卡片与资讯详情</h3>
            <p className="mt-2 text-sm text-slate-500">
              标题、分类、摘要、正文、封面和发布时间统一在“资讯管理”修改。
            </p>
            <div className="mt-4">
              <Button kind="soft" onClick={() => onTab("posts")}>
                <Pencil size={15} />
                进入资讯管理
              </Button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function BrandView({
  system,
  onEdit,
}: {
  system: Record<string, unknown> | null;
  onEdit: () => void;
}) {
  if (!system)
    return <p className="text-sm text-slate-500">正在读取品牌设置...</p>;
  const logo = String(system.siteLogo ?? "");
  const loginImage = String(system.customerLoginImage ?? "");
  const registerImage = String(system.customerRegisterImage ?? "");
  return (
    <section className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold">品牌、Logo 与客户页面图片</h1>
          <p className="mt-1 text-sm text-slate-500">
            这里控制所有前台页面顶部左侧的 Logo
            和名称，也控制联系页面显示的品牌全名。
          </p>
        </div>
        <Button onClick={onEdit}>
          <Pencil size={16} />
          修改品牌与页面图片
        </Button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-slate-500">当前前台效果</p>
        <div className="mt-5 flex min-h-20 items-center gap-4 rounded-lg bg-[#f5f5f7] px-5">
          {logo ? (
            <Image
              unoptimized
              src={logo}
              alt={String(system.siteLogoAlt ?? system.siteName ?? "Logo")}
              width={120}
              height={40}
              className="max-h-10 w-auto object-contain"
            />
          ) : (
            <div className="grid size-11 place-items-center rounded-md bg-blue-600 text-lg font-bold text-white">
              S
            </div>
          )}
          {system.showSiteName !== false ? (
            <div>
              <p className="font-semibold">
                {String(system.headerName ?? system.siteName ?? "SZA")}
              </p>
              <p className="text-xs text-slate-500">
                品牌全名：{String(system.siteName ?? "SZA POWER")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">客户登录与注册图片</p>
            <p className="mt-1 text-sm text-slate-500">
              登录页和注册页分别使用独立图片，中文与英文页面自动同步。
            </p>
          </div>
          <Button kind="soft" onClick={onEdit}>
            <Pencil size={15} />
            修改图片
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ["登录页面", loginImage],
            ["注册页面", registerImage],
          ].map(([label, image]) => (
            <div key={label}>
              <p className="mb-2 text-xs font-semibold text-slate-500">
                {label}
              </p>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#eef2ff]">
                {image ? (
                  <Image
                    unoptimized
                    src={image}
                    alt={label}
                    fill
                    sizes="360px"
                    className="object-contain"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-400">
                    尚未上传
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandEditor({
  system,
  setSystem,
  onSave,
  busy,
}: {
  system: Record<string, unknown> | null;
  setSystem: (value: Record<string, unknown>) => void;
  onSave: () => void;
  busy: boolean;
}) {
  if (!system)
    return <p className="text-sm text-slate-500">正在读取品牌设置...</p>;
  const update = (key: string, value: unknown) =>
    setSystem({ ...system, [key]: value });
  const logo = String(system.siteLogo ?? "");
  async function upload(file: File, key = "siteLogo") {
    const body = new FormData();
    body.set("file", file);
    const response = await adminFetch("/api/admin/media", {
      method: "POST",
      body,
    });
    const data = await response.json().catch(() => null);
    if (response.ok) update(key, data.url);
    else alert(data?.error ?? "图片上传失败");
  }
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="font-semibold">品牌文字</p>
          <p className="mt-1 text-sm text-slate-500">
            “顶部显示名称”对应截图左上角；“网站品牌全名”用于联系页等正式位置。
          </p>
        </div>
        <Label label="顶部显示名称">
          <input
            value={String(system.headerName ?? "")}
            onChange={(event) => update("headerName", event.target.value)}
            className={fields}
            placeholder="例如：SZA"
          />
        </Label>
        <Label label="网站品牌全名">
          <input
            value={String(system.siteName ?? "")}
            onChange={(event) => update("siteName", event.target.value)}
            className={fields}
            placeholder="例如：SZA POWER"
          />
        </Label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={system.showSiteName !== false}
            onChange={(event) => update("showSiteName", event.target.checked)}
          />
          在 Logo 旁显示顶部名称
        </label>
      </section>
      <section className="grid gap-4 rounded-lg border border-slate-200 p-4">
        <div>
          <p className="font-semibold">顶部 Logo</p>
          <p className="mt-1 text-sm text-slate-500">
            建议使用透明背景 PNG 或 WEBP，横向 Logo 显示效果更好。
          </p>
        </div>
        {logo ? (
          <div className="flex min-h-24 items-center justify-center rounded-lg bg-[#f5f5f7] p-4">
            <Image
              unoptimized
              src={logo}
              alt={String(system.siteLogoAlt ?? "Logo")}
              width={180}
              height={64}
              className="max-h-16 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
            尚未上传 Logo
          </div>
        )}
        <label className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700">
          <ImageIcon size={16} />
          上传 Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) =>
              event.target.files?.[0] && upload(event.target.files[0])
            }
          />
        </label>
        {logo ? (
          <Button kind="danger" onClick={() => update("siteLogo", "")}>
            <Trash2 size={15} />
            移除 Logo
          </Button>
        ) : null}
        <Label label="Logo 说明文字">
          <input
            value={String(system.siteLogoAlt ?? "")}
            onChange={(event) => update("siteLogoAlt", event.target.value)}
            className={fields}
            placeholder="例如：SZA POWER Logo"
          />
        </Label>
      </section>
      <section className="grid gap-5 rounded-lg border border-slate-200 p-4">
        <div>
          <p className="font-semibold">客户登录与注册页面图片</p>
          <p className="mt-1 text-sm text-slate-500">
            建议尺寸 1200 × 1400 像素，PNG、JPG 或 WEBP。图片位于双栏卡片左侧，手机端显示在表单上方。
          </p>
        </div>
        {[
          {
            key: "customerLoginImage",
            label: "登录页面图片",
            value: String(system.customerLoginImage ?? ""),
          },
          {
            key: "customerRegisterImage",
            label: "注册页面图片",
            value: String(system.customerRegisterImage ?? ""),
          },
        ].map((item) => (
          <div
            key={item.key}
            className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[180px_1fr] sm:items-center"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-[#eef2ff]">
              {item.value ? (
                <Image
                  unoptimized
                  src={item.value}
                  alt={item.label}
                  fill
                  sizes="180px"
                  className="object-contain"
                />
              ) : (
                <div className="grid h-full place-items-center text-xs text-slate-400">
                  暂无图片
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                当前内容：{item.value || "未设置，前台显示品牌渐变背景"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                  <ImageIcon size={16} />
                  {item.value ? "替换图片" : "上传图片"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) =>
                      event.target.files?.[0] &&
                      upload(event.target.files[0], item.key)
                    }
                  />
                </label>
                {item.value ? (
                  <Button kind="danger" onClick={() => update(item.key, "")}>
                    <Trash2 size={15} />
                    移除
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </section>
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={busy}>
          <Save size={16} />
          {busy ? "保存中..." : "保存品牌与页面图片"}
        </Button>
      </div>
    </div>
  );
}
function NavigationView({
  config,
  onEdit,
}: {
  config: NavigationConfig;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">顶部导航</h1>
          <p className="mt-1 text-sm text-slate-500">
            修改网站顶部菜单和展开面板内容。
          </p>
        </div>
        <Button onClick={onEdit}>
          <Pencil size={16} />
          编辑导航
        </Button>
      </div>
      <div className="mt-7 flex flex-wrap gap-2">
        {config.items.map((item) => (
          <span
            key={item.id}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium"
          >
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
function FooterView({
  footer,
  onEdit,
}: {
  footer: FooterContent;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">网站底部</h1>
          <p className="mt-1 text-sm text-slate-500">
            底部声明、版权、栏目和链接都可在这里修改。
          </p>
        </div>
        <Button onClick={onEdit}>
          <Pencil size={16} />
          编辑底部
        </Button>
      </div>
      <p className="mt-8 max-w-3xl text-sm leading-6 text-slate-600">
        {footer.disclaimer}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {footer.columns.map((column) => (
          <div key={column.title} className="rounded-md bg-slate-50 p-4">
            <p className="font-semibold">{column.title}</p>
            <p className="mt-2 text-sm text-slate-500">
              {column.links.map((link) => link.label).join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
function ShopView({
  products,
  onAdd,
  onEdit,
}: {
  products: Product[];
  onAdd: () => void;
  onEdit: (item: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = products.filter(
    (item) =>
      !normalized ||
      [item.name, item.nameCn, item.sku, item.price, item.priceCn].some(
        (value) => value.toLowerCase().includes(normalized),
      ),
  );
  const listed = products.filter(
    (item) => item.shopEnabled && item.status === "published",
  ).length;
  const unavailable = products.filter(
    (item) => item.inventoryStatus === "out_of_stock",
  ).length;
  const inventoryLabel = {
    in_stock: "可询价",
    preorder: "接受预订",
    out_of_stock: "暂不可订",
  } as const;
  return (
    <section className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold">商城管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            管理独立商城渠道的报价、SKU、库存状态和可见性，不影响“全部产品”目录。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cn/shop"
            target="_blank"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <ExternalLink size={15} />
            查看商城
          </Link>
          <Button onClick={onAdd}>
            <Plus size={16} />
            新增商品
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">商城商品</p>
          <p className="mt-2 text-2xl font-semibold">{listed}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">暂不可订</p>
          <p className="mt-2 text-2xl font-semibold">{unavailable}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">渠道状态</p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            独立商城已启用
          </p>
        </div>
      </div>
      <label className="relative max-w-xl">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索商品、SKU 或报价"
          className={`${fields} pl-9`}
        />
      </label>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">英文报价</th>
              <th className="px-4 py-3">中文报价</th>
              <th className="px-4 py-3">库存</th>
              <th className="px-4 py-3">商城状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <Image
                        unoptimized
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {item.nameCn || item.name}
                      </p>
                      <p className="text-xs text-slate-500">{item.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {item.sku || `SZA-${item.id}`}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.price}</p>
                  {item.compareAtPrice ? (
                    <p className="text-xs text-slate-400 line-through">
                      {item.compareAtPrice}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.priceCn}</p>
                  {item.compareAtPriceCn ? (
                    <p className="text-xs text-slate-400 line-through">
                      {item.compareAtPriceCn}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {inventoryLabel[item.inventoryStatus]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${item.shopEnabled && item.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {item.shopEnabled && item.status === "published"
                      ? "商城可见"
                      : "商城隐藏"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button kind="soft" onClick={() => onEdit(item)}>
                      <Pencil size={15} />
                      编辑商城信息
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length ? (
          <div className="py-14 text-center text-sm text-slate-500">
            没有符合条件的商城商品。
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProductsView({
  products,
  onAdd,
  onEdit,
  onDelete,
}: {
  products: Product[];
  onAdd: () => void;
  onEdit: (item: Product) => void;
  onDelete: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Product["status"]>("all");
  const normalized = query.trim().toLowerCase();
  const visible = products.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesQuery =
      !normalized ||
      [item.name, item.nameCn, item.slug, item.color, item.capacity].some(
        (value) => value.toLowerCase().includes(normalized),
      );
    return matchesStatus && matchesQuery;
  });
  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold">产品目录</h1>
          <p className="mt-1 text-sm text-slate-500">
            维护产品主数据、规格、图片、排序和发布状态；商城报价请在“商城管理”中查看。
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus size={16} />
          新增产品
        </Button>
      </div>
      <div className="mb-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索产品名称、URL、颜色或容量"
            className={`${fields} pl-9`}
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className={`${fields} sm:w-36`}
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">产品</th>
              <th className="px-4 py-3">颜色</th>
              <th className="px-4 py-3">容量</th>
              <th className="px-4 py-3">排序</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <Image
                        unoptimized
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.nameCn || item.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.name} · /{item.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{item.colorCn || item.color}</td>
                <td className="px-4 py-3">
                  {item.capacityCn || item.capacity}
                </td>
                <td className="px-4 py-3 text-slate-500">{item.sortOrder}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {item.status === "published" ? "已发布" : "草稿"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/cn/products/${item.slug}`}
                      target="_blank"
                      title="预览前台"
                      className="grid size-10 place-items-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <ExternalLink size={15} />
                    </Link>
                    <Button kind="soft" onClick={() => onEdit(item)}>
                      <Pencil size={15} />
                      编辑
                    </Button>
                    <Button kind="danger" onClick={() => onDelete(item.id)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length ? (
          <div className="py-14 text-center text-sm text-slate-500">
            没有符合条件的产品。
          </div>
        ) : null}
      </div>
    </section>
  );
}
function PostsView({
  posts,
  onAdd,
  onEdit,
  onDelete,
}: {
  posts: Post[];
  onAdd: () => void;
  onEdit: (item: Post) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <section>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">资讯管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            管理新闻和产品故事的中英文版本。
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus size={16} />
          新增资讯
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((item) => (
          <article
            key={item.id}
            className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
              <Image
                unoptimized
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-blue-600">
                {item.category}
              </p>
              <h2 className="mt-1 truncate font-semibold">{item.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {item.excerpt}
              </p>
              <div className="mt-3 flex gap-2">
                <Button kind="soft" onClick={() => onEdit(item)}>
                  <Pencil size={15} />
                  编辑
                </Button>
                <Button kind="danger" onClick={() => onDelete(item.id)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function InquiriesView({
  inquiries,
  onUpdate,
}: {
  inquiries: Inquiry[];
  onUpdate: (id: number, status: Inquiry["status"]) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold">客户留言</h1>
      <p className="mt-1 text-sm text-slate-500">
        来自前台联系表单的客户需求，按行查看和更新跟进状态。
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-3">客户</th>
              <th className="px-3 py-3">公司 / 地区</th>
              <th className="px-3 py-3">需求类型</th>
              <th className="px-3 py-3">留言</th>
              <th className="px-3 py-3">时间</th>
              <th className="px-3 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length ? (
              inquiries.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 align-top hover:bg-slate-50"
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold">{item.name}</p>
                    <a
                      href={`mailto:${item.email}`}
                      className="mt-1 block text-xs text-blue-600 hover:underline"
                    >
                      {item.email}
                    </a>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.company || "未填写公司"}
                    <br />
                    <span className="text-xs text-slate-400">
                      {item.country || "未填写地区"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.projectType}
                  </td>
                  <td className="max-w-[260px] px-3 py-3">
                    <details>
                      <summary className="cursor-pointer truncate text-slate-700">
                        {item.message}
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                        {item.message}
                      </p>
                    </details>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString("zh-CN", {
                      hour12: false,
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        onUpdate(
                          item.id,
                          event.target.value as Inquiry["status"],
                        )
                      }
                      className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                    >
                      <option value="new">待跟进</option>
                      <option value="contacted">已联系</option>
                      <option value="closed">已关闭</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-slate-500"
                >
                  暂时没有客户留言。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function SystemView({
  system,
  setSystem,
  onSave,
  onBackup,
}: {
  system: Record<string, unknown> | null;
  setSystem: (value: Record<string, unknown>) => void;
  onSave: () => void;
  onBackup: () => void;
}) {
  if (!system)
    return <p className="text-sm text-slate-500">正在读取系统设置...</p>;
  const update = (key: string, value: unknown) =>
    setSystem({ ...system, [key]: value });
  const mailProvider = ["163", "qq", "custom"].includes(
    String(system.smtpProvider ?? ""),
  )
    ? String(system.smtpProvider)
    : String(system.smtpHost ?? "").toLowerCase() === "smtp.qq.com"
      ? "qq"
      : String(system.smtpHost ?? "").toLowerCase() === "smtp.163.com"
        ? "163"
        : "custom";
  const applyMailProvider = (provider: string) => {
    if (provider === "163") {
      setSystem({
        ...system,
        smtpProvider: "163",
        smtpHost: "smtp.163.com",
        smtpPort: 465,
      });
      return;
    }
    if (provider === "qq") {
      setSystem({
        ...system,
        smtpProvider: "qq",
        smtpHost: "smtp.qq.com",
        smtpPort: 465,
      });
      return;
    }
    setSystem({ ...system, smtpProvider: "custom" });
  };
  const mailFields = [
    ["smtpUser", "SMTP 用户名"],
    ["smtpPassword", "SMTP 授权码"],
    ["smtpFrom", "发件人地址"],
    ["notificationEmail", "留言通知邮箱"],
  ] as const;
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Mail size={19} className="text-blue-600" />
          <h1 className="text-xl font-semibold">邮件服务器</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          配置后，留言通知和密码重置邮件会从这里发送。
        </p>
        <div className="mt-5 grid gap-4">
          <Label label="邮箱服务商">
            <select
              value={mailProvider}
              onChange={(event) => applyMailProvider(event.target.value)}
              className={fields}
            >
              <option value="163">网易 163 邮箱（推荐）</option>
              <option value="qq">QQ 邮箱</option>
              <option value="custom">其他 SMTP</option>
            </select>
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="SMTP 服务器">
              <input
                value={String(system.smtpHost ?? "")}
                readOnly={mailProvider !== "custom"}
                onChange={(event) => update("smtpHost", event.target.value)}
                className={`${fields} read-only:bg-slate-50 read-only:text-slate-500`}
              />
            </Label>
            <Label label="SMTP 端口">
              <input
                type="number"
                min="1"
                max="65535"
                value={String(system.smtpPort ?? 465)}
                readOnly={mailProvider !== "custom"}
                onChange={(event) =>
                  update("smtpPort", Number(event.target.value))
                }
                className={`${fields} read-only:bg-slate-50 read-only:text-slate-500`}
              />
            </Label>
          </div>
          {mailFields.map(([key, label]) => (
            <Label key={key} label={label}>
              <input
                type={key === "smtpPassword" ? "password" : "text"}
                value={String(system[key] ?? "")}
                onChange={(event) => update(key, event.target.value)}
                className={fields}
              />
            </Label>
          ))}
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            163 邮箱和 QQ 邮箱请填写完整邮箱地址，并使用邮箱后台生成的 SMTP
            授权码，不要填写邮箱登录密码。发件人地址通常与 SMTP 用户名相同。
          </p>
        </div>
        <div className="mt-5">
          <Button onClick={onSave}>
            <Save size={16} />
            保存邮件设置
          </Button>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare size={19} className="text-blue-600" />
          <h1 className="text-xl font-semibold">前台联系信息</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          这些内容显示在“联系”页面左侧信息卡片。
        </p>
        <div className="mt-5 grid gap-4">
          <Label label="联系邮箱">
            <input
              value={String(system.contactEmail ?? "")}
              onChange={(event) => update("contactEmail", event.target.value)}
              className={fields}
            />
          </Label>
          <Label label="地区 / 地址说明">
            <input
              value={String(system.contactLocation ?? "")}
              onChange={(event) =>
                update("contactLocation", event.target.value)
              }
              className={fields}
            />
          </Label>
          <Label label="联系说明">
            <textarea
              value={String(system.contactDescription ?? "")}
              onChange={(event) =>
                update("contactDescription", event.target.value)
              }
              className={textareas}
            />
          </Label>
        </div>
        <div className="mt-5">
          <Button onClick={onSave}>
            <Save size={16} />
            保存联系信息
          </Button>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={19} className="text-blue-600" />
          <h1 className="text-xl font-semibold">安全与备份</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          设置找回密码有效时间，并下载网站数据库备份。
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Label label="找回密码有效期（小时）">
            <input
              type="number"
              min="1"
              max="24"
              value={String(system.passwordResetHours ?? 2)}
              onChange={(event) =>
                update("passwordResetHours", Number(event.target.value))
              }
              className={fields}
            />
          </Label>
          <Label label="登录失败锁定时长（分钟）">
            <input
              type="number"
              min="5"
              max="1440"
              value={String(system.loginLockMinutes ?? 30)}
              onChange={(event) =>
                update("loginLockMinutes", Number(event.target.value))
              }
              className={fields}
            />
          </Label>
          <Label label="连续失败次数">
            <input
              type="number"
              min="3"
              max="10"
              value={String(system.loginMaxAttempts ?? 5)}
              onChange={(event) =>
                update("loginMaxAttempts", Number(event.target.value))
              }
              className={fields}
            />
          </Label>
          <Label label="自动备份间隔（小时）">
            <input
              type="number"
              min="1"
              max="168"
              value={String(system.automaticBackupHours ?? 24)}
              onChange={(event) =>
                update("automaticBackupHours", Number(event.target.value))
              }
              className={fields}
            />
          </Label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={system.automaticBackupEnabled !== false}
              onChange={(event) =>
                update("automaticBackupEnabled", event.target.checked)
              }
            />
            启用自动备份
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onSave}>
            <Save size={16} />
            保存安全设置
          </Button>
          <Button kind="soft" onClick={onBackup}>
            <Archive size={16} />
            数据库备份
          </Button>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">媒体上传规则</h2>
        <p className="mt-1 text-sm text-slate-500">
          产品、页面与品牌编辑器均可上传媒体，单文件上限为 256
          MB。完整媒体库、日志、管理员与备份位于“运维中心”。
        </p>
      </section>
    </div>
  );
}
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-md bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function LocaleInputs({
  en,
  cn,
  setEn,
  setCn,
  label,
}: {
  en: string;
  cn: string;
  setEn: (value: string) => void;
  setCn: (value: string) => void;
  label: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Label label={`${label}（英文）`}>
        <input
          value={en}
          onChange={(event) => setEn(event.target.value)}
          className={fields}
        />
      </Label>
      <Label label={`${label}（中文）`}>
        <input
          value={cn}
          onChange={(event) => setCn(event.target.value)}
          className={fields}
        />
      </Label>
    </div>
  );
}
function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  async function upload(file: File) {
    const body = new FormData();
    body.set("file", file);
    const response = await adminFetch("/api/admin/media", {
      method: "POST",
      body,
    });
    const data = await response.json();
    if (response.ok) onChange(data.url);
    else alert(data.error ?? "上传失败");
  }
  return (
    <div className="grid gap-3">
      <Label label="图片">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fields}
        >
          {images.map((item) => (
            <option key={item} value={item}>
              {item.split("/").pop()}
            </option>
          ))}
          {value.startsWith("/uploads/") || value.startsWith("/api/media/") ? (
            <option value={value}>{value.split("/").pop()}</option>
          ) : null}
        </select>
      </Label>
      <label className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700">
        上传本地图片
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) =>
            event.target.files?.[0] && upload(event.target.files[0])
          }
        />
      </label>
    </div>
  );
}
function ProductGalleryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  async function upload(files: FileList) {
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", file);
      const response = await adminFetch("/api/admin/media", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        alert(data?.error ?? `${file.name} 上传失败`);
        continue;
      }
      added.push(data.url);
    }
    if (added.length) onChange(Array.from(new Set([...value, ...added])));
  }
  const makeMain = (index: number) =>
    onChange([
      value[index],
      ...value.filter((_, itemIndex) => itemIndex !== index),
    ]);
  const remove = (index: number) =>
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="font-semibold">产品图片（可多张）</p>
        <p className="mt-1 text-sm text-slate-500">
          可一次选择多张图片，不限制应用内文件大小。第一张是列表和详情页主图，可随时设为主图。
        </p>
      </div>
      <label className="inline-flex min-h-10 w-fit cursor-pointer items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700">
        <Plus size={16} />
        选择多张图片
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => event.target.files && upload(event.target.files)}
        />
      </label>
      {value.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((src, index) => (
            <article
              key={`${src}-${index}`}
              className="overflow-hidden rounded-lg border border-slate-200"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  unoptimized
                  src={src}
                  alt={`产品图片 ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                {index === 0 ? (
                  <span className="inline-flex min-h-9 items-center rounded-md bg-blue-50 px-3 text-xs font-semibold text-blue-600">
                    当前主图
                  </span>
                ) : (
                  <Button kind="soft" onClick={() => makeMain(index)}>
                    设为主图
                  </Button>
                )}
                <Button kind="danger" onClick={() => remove(index)}>
                  <Trash2 size={15} />
                  删除
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          请至少上传一张产品图片。
        </p>
      )}
    </section>
  );
}
function ProductVideoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await adminFetch("/api/admin/media", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "视频上传失败");
      onChange(data.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "视频上传失败");
    } finally {
      setUploading(false);
    }
  }
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="font-semibold">产品视频</p>
        <p className="mt-1 text-sm text-slate-500">
          支持 MP4、WebM 或 OGG。前台会自动静音、循环播放，无需用户点击。
        </p>
      </div>
      {value ? (
        <video
          src={value}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="aspect-video w-full rounded-md bg-black object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700">
          <Plus size={16} />
          {uploading ? "上传中..." : value ? "替换视频" : "上传视频"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            disabled={uploading}
            className="hidden"
            onChange={(event) =>
              event.target.files?.[0] && void upload(event.target.files[0])
            }
          />
        </label>
        {value ? (
          <Button kind="danger" onClick={() => onChange("")}>
            <Trash2 size={15} />
            移除视频
          </Button>
        ) : null}
      </div>
    </section>
  );
}
function ProductEditor({
  value,
  setValue,
  onSave,
  busy,
}: {
  value: Partial<Product>;
  setValue: (value: Partial<Product>) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const set = (key: keyof Product, input: unknown) =>
    setValue({ ...value, [key]: input });
  return (
    <div className="grid gap-4">
      <LocaleInputs
        label="产品名称"
        en={value.name ?? ""}
        cn={value.nameCn ?? ""}
        setEn={(input) => set("name", input)}
        setCn={(input) => set("nameCn", input)}
      />
      <Label label="URL 标识（英文小写，例如 blue-titanium）">
        <input
          value={value.slug ?? ""}
          onChange={(event) => set("slug", event.target.value)}
          className={fields}
        />
      </Label>
      <LocaleInputs
        label="一句话描述"
        en={value.subtitle ?? ""}
        cn={value.subtitleCn ?? ""}
        setEn={(input) => set("subtitle", input)}
        setCn={(input) => set("subtitleCn", input)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Label label="详细描述（英文）">
          <textarea
            value={value.description ?? ""}
            onChange={(event) => set("description", event.target.value)}
            className={textareas}
          />
        </Label>
        <Label label="详细描述（中文）">
          <textarea
            value={value.descriptionCn ?? ""}
            onChange={(event) => set("descriptionCn", event.target.value)}
            className={textareas}
          />
        </Label>
      </div>
      <LocaleInputs
        label="颜色"
        en={value.color ?? ""}
        cn={value.colorCn ?? ""}
        setEn={(input) => set("color", input)}
        setCn={(input) => set("colorCn", input)}
      />
      <LocaleInputs
        label={"容量"}
        en={value.capacity ?? ""}
        cn={value.capacityCn ?? ""}
        setEn={(input) => set("capacity", input)}
        setCn={(input) => set("capacityCn", input)}
      />
      <section className="grid gap-4 rounded-md border border-blue-100 bg-blue-50/40 p-4">
        <div>
          <p className="font-semibold">商城与报价</p>
          <p className="mt-1 text-sm text-slate-500">
            这些字段只控制独立商城页面；产品目录仍保留产品资料。
          </p>
        </div>
        <Label label="SKU">
          <input
            value={value.sku ?? ""}
            onChange={(event) => set("sku", event.target.value)}
            placeholder="例如 SZA-PB-001"
            className={fields}
          />
        </Label>
        <LocaleInputs
          label="当前报价"
          en={value.price ?? ""}
          cn={value.priceCn ?? ""}
          setEn={(input) => set("price", input)}
          setCn={(input) => set("priceCn", input)}
        />
        <LocaleInputs
          label="划线价（可选）"
          en={value.compareAtPrice ?? ""}
          cn={value.compareAtPriceCn ?? ""}
          setEn={(input) => set("compareAtPrice", input)}
          setCn={(input) => set("compareAtPriceCn", input)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Label label="库存状态">
            <select
              value={value.inventoryStatus ?? "in_stock"}
              onChange={(event) => set("inventoryStatus", event.target.value)}
              className={fields}
            >
              <option value="in_stock">可询价</option>
              <option value="preorder">接受预订</option>
              <option value="out_of_stock">暂不可订</option>
            </select>
          </Label>
          <label className="flex min-h-11 items-center gap-2 self-end text-sm font-medium">
            <input
              type="checkbox"
              checked={value.shopEnabled !== false}
              onChange={(event) => set("shopEnabled", event.target.checked)}
            />
            在独立商城展示
          </label>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Label label={"输入"}>
          <input
            value={value.input ?? ""}
            onChange={(event) => set("input", event.target.value)}
            className={fields}
          />
        </Label>
        <Label label={"输出"}>
          <input
            value={value.output ?? ""}
            onChange={(event) => set("output", event.target.value)}
            className={fields}
          />
        </Label>
      </div>
      <ProductGalleryPicker
        value={value.images?.length ? value.images : [value.image ?? images[0]]}
        onChange={(items) =>
          setValue({ ...value, images: items, image: items[0] ?? images[0] })
        }
      />
      <ProductVideoPicker
        value={value.video ?? ""}
        onChange={(video) => set("video", video)}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Label label="排序">
          <input
            type="number"
            value={value.sortOrder ?? 100}
            onChange={(event) => set("sortOrder", Number(event.target.value))}
            className={fields}
          />
        </Label>
        <Label label="状态">
          <select
            value={value.status ?? "published"}
            onChange={(event) => set("status", event.target.value)}
            className={fields}
          >
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </Label>
        <label className="flex min-h-11 items-center gap-2 self-end text-sm font-medium">
          <input
            type="checkbox"
            checked={Boolean(value.featured)}
            onChange={(event) => set("featured", event.target.checked)}
          />
          推荐产品
        </label>
      </div>
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={busy}>
          <Save size={16} />
          {busy ? "保存中..." : "保存产品"}
        </Button>
      </div>
    </div>
  );
}
function PostEditor({
  value,
  setValue,
  onSave,
  busy,
}: {
  value: Partial<Post>;
  setValue: (value: Partial<Post>) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const set = (key: keyof Post, input: unknown) =>
    setValue({ ...value, [key]: input });
  return (
    <div className="grid gap-4">
      <LocaleInputs
        label="文章标题"
        en={value.title ?? ""}
        cn={value.titleCn ?? ""}
        setEn={(input) => set("title", input)}
        setCn={(input) => set("titleCn", input)}
      />
      <Label label="URL 标识">
        <input
          value={value.slug ?? ""}
          onChange={(event) => set("slug", event.target.value)}
          className={fields}
        />
      </Label>
      <div className="grid gap-3 md:grid-cols-2">
        <Label label="摘要（英文）">
          <textarea
            value={value.excerpt ?? ""}
            onChange={(event) => set("excerpt", event.target.value)}
            className={textareas}
          />
        </Label>
        <Label label="摘要（中文）">
          <textarea
            value={value.excerptCn ?? ""}
            onChange={(event) => set("excerptCn", event.target.value)}
            className={textareas}
          />
        </Label>
        <Label label="正文（英文）">
          <textarea
            value={value.content ?? ""}
            onChange={(event) => set("content", event.target.value)}
            className={textareas}
          />
        </Label>
        <Label label="正文（中文）">
          <textarea
            value={value.contentCn ?? ""}
            onChange={(event) => set("contentCn", event.target.value)}
            className={textareas}
          />
        </Label>
      </div>
      <LocaleInputs
        label="分类"
        en={value.category ?? ""}
        cn={value.categoryCn ?? ""}
        setEn={(input) => set("category", input)}
        setCn={(input) => set("categoryCn", input)}
      />
      <ImagePicker
        value={value.image ?? images[0]}
        onChange={(input) => set("image", input)}
      />
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={busy}>
          <Save size={16} />
          {busy ? "保存中..." : "保存资讯"}
        </Button>
      </div>
    </div>
  );
}
function PageEditor({
  pageKey,
  value,
  onChange,
  onSave,
  busy,
}: {
  pageKey: keyof SiteContent;
  value: SiteContent[keyof SiteContent];
  onChange: (value: SiteContent[keyof SiteContent]) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const set = (key: keyof SiteContent[keyof SiteContent], input: unknown) =>
    onChange({ ...value, [key]: input });
  const media = value.media;
  const clearMedia = () => onChange({ ...value, media: undefined });
  const sections = value.sections ?? [];
  const mediaSections = sections
    .map((section, index) => ({ section, index }))
    .filter(
      ({ section }) =>
        pageKey !== "home" ||
        section.id === "hero-color" ||
        section.id === "hero-orange",
    );
  const sectionNames: Record<string, string> = {
    "hero-color": "首页第 2 屏：彩色系列",
    "hero-orange": "首页第 3 屏：橙色特别款",
    "promo-blue": "首页展示卡：蓝钛金属款",
    "promo-pastel": "首页展示卡：马卡龙配色",
    "promo-orange": "首页展示卡：橙色",
    "promo-rose": "首页展示卡：玫瑰粉",
    "promo-usb": "首页展示卡：USB-C",
    "promo-multi": "首页展示卡：多彩系列",
    company: "关于页面：公司介绍",
    philosophy: "关于页面：产品理念",
    cooperation: "关于页面：国际合作",
    charging: "支持页面：充电基础",
    battery: "支持页面：电池保养",
    warranty: "支持页面：保修支持",
    distribution: "支持页面：分销支持",
    catalog: "产品页面：所有产品标题区",
    guides: "产品页面：选购指南",
    daily: "产品页面：日常随身",
    retail: "产品页面：零售陈列",
    help: "产品页面：联系销售",
    information: "隐私政策：我们收集的信息",
    usage: "隐私政策：信息用途",
    storage: "隐私政策：保存与联系",
    website: "使用条款：网站内容",
    acceptable: "使用条款：合理使用",
    liability: "使用条款：责任与更新",
  };
  const labelNames: Partial<Record<keyof SiteContent, Record<string, string>>> = {
    products: { compare: "加入对比", selected: "已选择", clear: "清空对比", search: "搜索框提示", allProducts: "全部产品", featured: "精选产品", sortRecommended: "推荐排序", sortName: "名称排序", empty: "无结果提示", quote: "联系销售", viewAll: "查看全部", share: "分享", shared: "复制成功" },
    shop: { search: "搜索框提示", quote: "获取报价", details: "产品详情", empty: "无结果提示", loading: "加载提示" },
    news: { search: "搜索框提示", allCategories: "全部分类", readMore: "阅读更多", empty: "无结果提示", back: "返回资讯", moreStories: "更多资讯", readArticle: "阅读全文" },
    support: { faqTitle: "常见问题标题", faqSearch: "问题搜索提示", faqEmpty: "无结果提示", resourcesTitle: "服务资源标题" },
    contact: { submit: "提交按钮", sending: "提交中状态", success: "提交成功提示", error: "提交失败提示", productPrefix: "产品询盘前缀" },
    privacy: { lastUpdated: "最后更新标签", print: "打印按钮" },
    terms: { lastUpdated: "最后更新标签", print: "打印按钮" },
  };
  const updateSection = (index: number, patch: Partial<SiteContentSection>) =>
    onChange({
      ...value,
      sections: sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section,
      ),
    });
  const removeSection = (index: number) =>
    onChange({
      ...value,
      sections: sections.filter((_, sectionIndex) => sectionIndex !== index),
    });
  const addSection = () =>
    onChange({
      ...value,
      sections: [
        ...sections,
        { id: `section-${Date.now()}`, title: "新内容区", subtitle: "" },
      ],
    });
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold">页面文案</p>
        <Label label="眉题 / 小标题">
          <input
            value={value.eyebrow}
            onChange={(event) => set("eyebrow", event.target.value)}
            className={fields}
          />
        </Label>
        <Label label="主标题">
          <input
            value={value.title}
            onChange={(event) => set("title", event.target.value)}
            className={fields}
          />
        </Label>
        <Label label="介绍文案">
          <textarea
            value={value.subtitle}
            onChange={(event) => set("subtitle", event.target.value)}
            className={textareas}
          />
        </Label>
      </div>
      <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
        <div>
          <p className="font-semibold">页面按钮</p>
          <p className="mt-1 text-sm text-slate-500">
            按钮名称就是前台显示的文字；按钮地址填写站内路径，例如 /products 或
            /contact。留空则不显示。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Label label="主按钮名称">
            <input
              value={value.primaryLabel ?? ""}
              onChange={(event) => set("primaryLabel", event.target.value)}
              className={fields}
            />
          </Label>
          <Label label="主按钮地址">
            <input
              value={value.primaryHref ?? ""}
              onChange={(event) => set("primaryHref", event.target.value)}
              className={fields}
              placeholder="/products"
            />
          </Label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Label label="次按钮名称">
            <input
              value={value.secondaryLabel ?? ""}
              onChange={(event) => set("secondaryLabel", event.target.value)}
              className={fields}
            />
          </Label>
          <Label label="次按钮地址">
            <input
              value={value.secondaryHref ?? ""}
              onChange={(event) => set("secondaryHref", event.target.value)}
              className={fields}
              placeholder="/contact"
            />
          </Label>
        </div>
      </div>
      {labelNames[pageKey] ? (
        <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
          <div>
            <p className="font-semibold">按钮与交互文案</p>
            <p className="mt-1 text-sm text-slate-500">当前语言独立保存，切换右上角“中文 / EN”后分别修改。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(labelNames[pageKey] ?? {}).map(([key, name]) => (
              <Label key={key} label={name}>
                <input
                  value={value.labels?.[key] ?? ""}
                  onChange={(event) => set("labels", { ...value.labels, [key]: event.target.value })}
                  className={fields}
                />
              </Label>
            ))}
          </div>
        </div>
      ) : null}
      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <p className="font-semibold">页面业务功能</p>
          <p className="mt-1 text-sm text-slate-500">
            配置公告、可信数据、常见问题和服务资源，前台会自动使用当前页面样式展示。
          </p>
        </div>
        <Label label="页面公告（留空则隐藏）">
          <input
            value={value.notice ?? ""}
            onChange={(event) => set("notice", event.target.value)}
            className={fields}
          />
        </Label>
        {pageKey === "privacy" || pageKey === "terms" ? (
          <Label label="最后更新时间">
            <input
              type="date"
              value={value.lastUpdated ?? ""}
              onChange={(event) => set("lastUpdated", event.target.value)}
              className={fields}
            />
          </Label>
        ) : null}
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">业务指标</p>
            <Button
              kind="soft"
              onClick={() =>
                set("metrics", [
                  ...(value.metrics ?? []),
                  { value: "", label: "" },
                ])
              }
            >
              <Plus size={14} />
              新增指标
            </Button>
          </div>
          {value.metrics?.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-[1fr_2fr_auto]"
            >
              <input
                value={item.value}
                onChange={(event) =>
                  set(
                    "metrics",
                    value.metrics?.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, value: event.target.value }
                        : current,
                    ),
                  )
                }
                placeholder="数值，例如 10+"
                className={fields}
              />
              <input
                value={item.label}
                onChange={(event) =>
                  set(
                    "metrics",
                    value.metrics?.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, label: event.target.value }
                        : current,
                    ),
                  )
                }
                placeholder="指标说明"
                className={fields}
              />
              <Button
                kind="danger"
                onClick={() =>
                  set(
                    "metrics",
                    value.metrics?.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  )
                }
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">常见问题</p>
            <Button
              kind="soft"
              onClick={() =>
                set("faqs", [
                  ...(value.faqs ?? []),
                  { question: "", answer: "" },
                ])
              }
            >
              <Plus size={14} />
              新增问题
            </Button>
          </div>
          {value.faqs?.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3">
              <div className="flex gap-2">
                <input
                  value={item.question}
                  onChange={(event) =>
                    set(
                      "faqs",
                      value.faqs?.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, question: event.target.value }
                          : current,
                      ),
                    )
                  }
                  placeholder="问题"
                  className={fields}
                />
                <Button
                  kind="danger"
                  onClick={() =>
                    set(
                      "faqs",
                      value.faqs?.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <textarea
                value={item.answer}
                onChange={(event) =>
                  set(
                    "faqs",
                    value.faqs?.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, answer: event.target.value }
                        : current,
                    ),
                  )
                }
                placeholder="回答"
                className={textareas}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">服务资源</p>
            <Button
              kind="soft"
              onClick={() =>
                set("resources", [
                  ...(value.resources ?? []),
                  {
                    title: "",
                    description: "",
                    label: "了解更多",
                    href: "/contact",
                  },
                ])
              }
            >
              <Plus size={14} />
              新增资源
            </Button>
          </div>
          {value.resources?.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3">
              <div className="flex gap-2">
                <input
                  value={item.title}
                  onChange={(event) =>
                    set(
                      "resources",
                      value.resources?.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, title: event.target.value }
                          : current,
                      ),
                    )
                  }
                  placeholder="资源标题"
                  className={fields}
                />
                <Button
                  kind="danger"
                  onClick={() =>
                    set(
                      "resources",
                      value.resources?.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <textarea
                value={item.description}
                onChange={(event) =>
                  set(
                    "resources",
                    value.resources?.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, description: event.target.value }
                        : current,
                    ),
                  )
                }
                placeholder="资源说明"
                className={textareas}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={item.label}
                  onChange={(event) =>
                    set(
                      "resources",
                      value.resources?.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, label: event.target.value }
                          : current,
                      ),
                    )
                  }
                  placeholder="按钮文字"
                  className={fields}
                />
                <input
                  value={item.href}
                  onChange={(event) =>
                    set(
                      "resources",
                      value.resources?.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, href: event.target.value }
                          : current,
                      ),
                    )
                  }
                  placeholder="/contact"
                  className={fields}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4">
        <div>
          <p className="font-semibold text-slate-900">
            {pageKey === "home"
              ? "首页第 1 屏大图 / 视频"
              : `${pageNames[pageKey]}顶部大图 / 视频`}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            可以直接上传、更换或移除这张大图，也可以改为自动播放的视频。
          </p>
        </div>
        <div className="mt-4">
          <PageMediaPicker
            value={media}
            onChange={(next) => onChange({ ...value, media: next })}
            onClear={clearMedia}
          />
        </div>
      </div>
      {mediaSections.length ? (
        <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/40 p-4">
          <div>
            <p className="font-semibold text-slate-900">
              {pageKey === "home"
                ? "首页第 2、3 屏大图 / 视频"
                : `${pageNames[pageKey]}其他内容区图片 / 视频`}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              每张图片都已标注对应的前台位置，可分别上传、更换或移除。首页下方 6
              款产品的图片和文字请在“产品管理”中修改。
            </p>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {mediaSections.map(({ section, index }) => (
              <section
                key={`media-${section.id}-${index}`}
                className="rounded-lg border border-indigo-100 bg-white p-4"
              >
                <p className="mb-3 font-semibold text-indigo-950">
                  {sectionNames[section.id] || `自定义内容区 ${index + 1}`}
                </p>
                <PageMediaPicker
                  value={section.media}
                  onChange={(next) => updateSection(index, { media: next })}
                  onClear={() => updateSection(index, { media: undefined })}
                />
              </section>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="font-semibold">页面下方内容区</p>
            <p className="mt-1 text-sm text-slate-500">
              每一项都标明对应的前台位置；这里包括首页其他主视觉和卡片、关于页的“公司介绍
              / 产品理念 / 国际合作”、产品页选购内容和支持页帮助卡片。
            </p>
          </div>
          <Button kind="soft" onClick={addSection}>
            <Plus size={15} />
            新增内容区
          </Button>
        </div>
        {sections.length ? (
          <div className="grid gap-4">
            {sections.map((section, index) => (
              <section
                key={`${section.id}-${index}`}
                className="rounded-lg bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {sectionNames[section.id] || `自定义内容区 ${index + 1}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      当前标题：{section.title || "未命名"}
                    </p>
                  </div>
                  <Button kind="danger" onClick={() => removeSection(index)}>
                    <Trash2 size={15} />
                    删除
                  </Button>
                </div>
                <div className="mt-4 grid gap-3">
                  <Label label="小标题 / 眉题">
                    <input
                      value={section.eyebrow ?? ""}
                      onChange={(event) =>
                        updateSection(index, { eyebrow: event.target.value })
                      }
                      className={fields}
                    />
                  </Label>
                  <Label label="内容标题">
                    <input
                      value={section.title}
                      onChange={(event) =>
                        updateSection(index, { title: event.target.value })
                      }
                      className={fields}
                    />
                  </Label>
                  <Label label="内容说明">
                    <textarea
                      value={section.subtitle}
                      onChange={(event) =>
                        updateSection(index, { subtitle: event.target.value })
                      }
                      className={textareas}
                    />
                  </Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Label label="主按钮名称">
                      <input
                        value={section.primaryLabel ?? ""}
                        onChange={(event) =>
                          updateSection(index, {
                            primaryLabel: event.target.value,
                          })
                        }
                        className={fields}
                      />
                    </Label>
                    <Label label="主按钮地址">
                      <input
                        value={section.primaryHref ?? ""}
                        onChange={(event) =>
                          updateSection(index, {
                            primaryHref: event.target.value,
                          })
                        }
                        className={fields}
                      />
                    </Label>
                    <Label label="次按钮名称">
                      <input
                        value={section.secondaryLabel ?? ""}
                        onChange={(event) =>
                          updateSection(index, {
                            secondaryLabel: event.target.value,
                          })
                        }
                        className={fields}
                      />
                    </Label>
                    <Label label="次按钮地址">
                      <input
                        value={section.secondaryHref ?? ""}
                        onChange={(event) =>
                          updateSection(index, {
                            secondaryHref: event.target.value,
                          })
                        }
                        className={fields}
                      />
                    </Label>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
            当前页面没有下方内容区，可点击“新增内容区”创建。
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={busy}>
          <Save size={16} />
          {busy ? "发布中..." : "发布页面内容"}
        </Button>
      </div>
    </div>
  );
}

function PageMediaPicker({
  value,
  onChange,
  onClear,
}: {
  value?: PageMedia;
  onChange: (value: PageMedia) => void;
  onClear: () => void;
}) {
  const upload = async (file: File) => {
    const body = new FormData();
    body.set("file", file);
    const response = await adminFetch("/api/admin/media", {
      method: "POST",
      body,
    });
    const data = await response.json().catch(() => null);
    if (response.ok)
      onChange({
        type: file.type.startsWith("video/") ? "video" : "image",
        src: data.url,
        alt: value?.alt ?? "",
      });
    else alert(data?.error ?? "上传失败");
  };
  const type = value?.type ?? "image";
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="font-semibold">页面媒体</p>
        <p className="mt-1 text-sm text-slate-500">
          这里的图片或视频只属于当前区域，不会添加到产品库；应用内不限制文件大小。视频在前台自动静音循环播放，不显示播放按钮。
        </p>
      </div>
      <Label label="媒体类型">
        <select
          value={type}
          onChange={(event) =>
            onChange({
              type: event.target.value as "image" | "video",
              src: value?.src ?? "",
              alt: value?.alt ?? "",
            })
          }
          className={fields}
        >
          <option value="image">图片</option>
          <option value="video">视频（自动播放）</option>
        </select>
      </Label>
      <Label label={value?.src ? "更换当前图片 / 视频" : "添加图片 / 视频"}>
        <input
          type="file"
          accept={
            type === "video"
              ? "video/mp4,video/webm,video/ogg"
              : "image/png,image/jpeg,image/webp,image/gif"
          }
          onChange={(event) =>
            event.target.files?.[0] && upload(event.target.files[0])
          }
          className="block w-full rounded-md border border-slate-200 bg-white p-3 text-sm"
        />
      </Label>
      {value?.src ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {type === "video" ? (
            <video
              src={value.src}
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="relative aspect-video w-full">
              <Image
                unoptimized
                src={value.src}
                alt={value.alt || "媒体预览"}
                fill
                sizes="720px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      ) : null}
      <Label label="替代文字（图片说明）">
        <input
          value={value?.alt ?? ""}
          onChange={(event) =>
            onChange({
              type,
              src: value?.src ?? "",
              alt: event.target.value,
              poster: value?.poster,
            })
          }
          className={fields}
          placeholder="方便无障碍访问的说明"
        />
      </Label>
      {type === "video" ? (
        <Label label="视频封面图地址（可选）">
          <input
            value={value?.poster ?? ""}
            onChange={(event) =>
              onChange({
                type,
                src: value?.src ?? "",
                alt: value?.alt,
                poster: event.target.value,
              })
            }
            className={fields}
            placeholder="/uploads/poster.jpg"
          />
        </Label>
      ) : null}
      {value?.src ? (
        <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm">
          <span className="truncate text-slate-600">{value.src}</span>
          <Button kind="danger" onClick={onClear}>
            <Trash2 size={15} />
            移除媒体
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          尚未上传媒体，页面会使用默认展示。
        </p>
      )}
    </div>
  );
}

function FooterEditor({
  value,
  onChange,
  onSave,
  busy,
}: {
  value: FooterContent;
  onChange: (value: FooterContent) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const updateColumn = (
    index: number,
    patch: Partial<FooterContent["columns"][number]>,
  ) =>
    onChange({
      ...value,
      columns: value.columns.map((column, columnIndex) =>
        columnIndex === index ? { ...column, ...patch } : column,
      ),
    });
  const updateLink = (
    columnIndex: number,
    linkIndex: number,
    patch: Partial<FooterContent["columns"][number]["links"][number]>,
  ) =>
    onChange({
      ...value,
      columns: value.columns.map((column, index) =>
        index === columnIndex
          ? {
              ...column,
              links: column.links.map((link, innerIndex) =>
                innerIndex === linkIndex ? { ...link, ...patch } : link,
              ),
            }
          : column,
      ),
    });
  const addColumn = () =>
    onChange({
      ...value,
      columns: [...value.columns, { title: "新栏目", links: [] }],
    });
  const removeColumn = (index: number) =>
    onChange({
      ...value,
      columns: value.columns.filter((_, columnIndex) => columnIndex !== index),
    });
  const addLink = (columnIndex: number) =>
    onChange({
      ...value,
      columns: value.columns.map((column, index) =>
        index === columnIndex
          ? {
              ...column,
              links: [...column.links, { label: "新链接", href: "/" }],
            }
          : column,
      ),
    });
  const removeLink = (columnIndex: number, linkIndex: number) =>
    onChange({
      ...value,
      columns: value.columns.map((column, index) =>
        index === columnIndex
          ? {
              ...column,
              links: column.links.filter(
                (_, innerIndex) => innerIndex !== linkIndex,
              ),
            }
          : column,
      ),
    });
  const updateLegal = (
    index: number,
    patch: Partial<FooterContent["legalLinks"][number]>,
  ) =>
    onChange({
      ...value,
      legalLinks: value.legalLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link,
      ),
    });
  const addLegal = () =>
    onChange({
      ...value,
      legalLinks: [...value.legalLinks, { label: "新链接", href: "/" }],
    });
  const removeLegal = (index: number) =>
    onChange({
      ...value,
      legalLinks: value.legalLinks.filter(
        (_, linkIndex) => linkIndex !== index,
      ),
    });
  const socialDefaults: NonNullable<FooterContent["socialLinks"]> = [
    {
      platform: "douyin",
      label: "\u6296\u97f3",
      href: "https://www.douyin.com/",
    },
    { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/" },
    { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
    { platform: "x", label: "X", href: "https://x.com/" },
    {
      platform: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/",
    },
    {
      platform: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/",
    },
    {
      platform: "kuaishou",
      label: "\u5feb\u624b",
      href: "https://www.kuaishou.com/",
    },
    {
      platform: "bilibili",
      label: "\u54d4\u54e9\u54d4\u54e9",
      href: "https://www.bilibili.com/",
    },
    { platform: "weibo", label: "\u5fae\u535a", href: "https://weibo.com/" },
  ];
  const socialLinks = value.socialLinks?.length
    ? value.socialLinks
    : socialDefaults;
  const updateSocial = (index: number, href: string) =>
    onChange({
      ...value,
      socialLinks: socialLinks.map((item, itemIndex) =>
        itemIndex === index ? { ...item, href } : item,
      ),
    });

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">底部基础信息</p>
        <p className="mt-1 text-sm text-slate-500">
          这些文字会显示在网站底部，直接填写即可。
        </p>
        <div className="mt-4 grid gap-4">
          <Label label="底部声明">
            <textarea
              value={value.disclaimer}
              onChange={(event) =>
                onChange({ ...value, disclaimer: event.target.value })
              }
              className={textareas}
            />
          </Label>
          <Label label="版权文字">
            <input
              value={value.copyright}
              onChange={(event) =>
                onChange({ ...value, copyright: event.target.value })
              }
              className={fields}
            />
          </Label>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">底部栏目</p>
            <p className="text-sm text-slate-500">每个栏目可以添加多个链接。</p>
            <p className="mt-1 text-xs text-blue-600">
              链接地址规则：以 / 开头是本站页面（如 /about）；填写
              http://、https:// 或 www. 开头的网址是外部链接。
            </p>
          </div>
          <Button kind="soft" onClick={addColumn}>
            <Plus size={15} />
            新增栏目
          </Button>
        </div>
        {value.columns.map((column, columnIndex) => (
          <section
            key={columnIndex}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label label={"栏目 " + (columnIndex + 1) + " 名称"}>
                  <input
                    value={column.title}
                    onChange={(event) =>
                      updateColumn(columnIndex, { title: event.target.value })
                    }
                    className={fields}
                  />
                </Label>
              </div>
              <Button kind="danger" onClick={() => removeColumn(columnIndex)}>
                <Trash2 size={15} />
                删除栏目
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {column.links.map((link, linkIndex) => (
                <div
                  key={linkIndex}
                  className="grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-[1fr_1.2fr_auto] md:items-end"
                >
                  <Label label="链接名称">
                    <input
                      value={link.label}
                      onChange={(event) =>
                        updateLink(columnIndex, linkIndex, {
                          label: event.target.value,
                        })
                      }
                      className={fields}
                    />
                  </Label>
                  <Label label="链接地址">
                    <input
                      value={link.href}
                      onChange={(event) =>
                        updateLink(columnIndex, linkIndex, {
                          href: event.target.value,
                        })
                      }
                      className={fields}
                    />
                  </Label>
                  <Button
                    kind="danger"
                    onClick={() => removeLink(columnIndex, linkIndex)}
                  >
                    <Trash2 size={15} />
                    删除
                  </Button>
                </div>
              ))}
              <Button kind="soft" onClick={() => addLink(columnIndex)}>
                <Plus size={15} />
                新增链接
              </Button>
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">底部快捷链接</p>
            <p className="text-sm text-slate-500">
              例如隐私政策、使用条款和联系我们。
            </p>
          </div>
          <Button kind="soft" onClick={addLegal}>
            <Plus size={15} />
            新增链接
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {value.legalLinks.map((link, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-[1fr_1.2fr_auto] md:items-end"
            >
              <Label label="链接名称">
                <input
                  value={link.label}
                  onChange={(event) =>
                    updateLegal(index, { label: event.target.value })
                  }
                  className={fields}
                />
              </Label>
              <Label label="链接地址">
                <input
                  value={link.href}
                  onChange={(event) =>
                    updateLegal(index, { href: event.target.value })
                  }
                  className={fields}
                />
              </Label>
              <Button kind="danger" onClick={() => removeLegal(index)}>
                <Trash2 size={15} />
                删除
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <div>
          <p className="font-semibold">
            {"\u793e\u4ea4\u5a92\u4f53\u56fe\u6807"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {
              "\u586b\u5199\u5e73\u53f0\u4e3b\u9875\u94fe\u63a5\u540e\u5373\u4f1a\u5728\u7f51\u7ad9\u6700\u5e95\u90e8\u663e\u793a\u56fe\u6807\uff1b\u7559\u7a7a\u5219\u4e0d\u663e\u793a\u3002"
            }
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {socialLinks.map((item, index) => (
            <Label key={item.platform} label={item.label}>
              <input
                value={item.href}
                onChange={(event) => updateSocial(index, event.target.value)}
                className={fields}
                placeholder="https://..."
              />
            </Label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <Label label={"ICP \u5907\u6848\u53f7"}>
          <input
            value={value.icpNumber ?? ""}
            onChange={(event) =>
              onChange({ ...value, icpNumber: event.target.value })
            }
            className={fields}
            placeholder={"\u4f8b\u5982\uff1a\u7ca4 ICP \u5907 12345678 \u53f7"}
          />
        </Label>
        <p className="mt-2 text-xs text-slate-500">
          {
            "\u524d\u53f0\u70b9\u51fb\u5907\u6848\u53f7\u4f1a\u81ea\u52a8\u8df3\u8f6c\u5230\u5de5\u4e1a\u548c\u4fe1\u606f\u5316\u90e8 ICP \u5907\u6848\u67e5\u8be2\u7f51\u7ad9\u3002"
          }
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={busy}>
          <Save size={16} />
          {busy
            ? "\u4fdd\u5b58\u4e2d..."
            : "\u4fdd\u5b58\u7f51\u7ad9\u5e95\u90e8"}
        </Button>
      </div>
    </div>
  );
}

function NavigationEditor({
  value,
  onChange,
  onSave,
  busy,
}: {
  value: NavigationConfig;
  onChange: (value: NavigationConfig) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const updateItem = (
    index: number,
    patch: Partial<NavigationConfig["items"][number]>,
  ) =>
    onChange({
      ...value,
      items: value.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    });
  const updateColumn = (
    itemIndex: number,
    columnIndex: number,
    patch: Partial<NavigationConfig["items"][number]["columns"][number]>,
  ) =>
    onChange({
      ...value,
      items: value.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              columns: item.columns.map((column, innerIndex) =>
                innerIndex === columnIndex ? { ...column, ...patch } : column,
              ),
            }
          : item,
      ),
    });
  const updateLink = (
    itemIndex: number,
    columnIndex: number,
    linkIndex: number,
    patch: Partial<
      NavigationConfig["items"][number]["columns"][number]["links"][number]
    >,
  ) =>
    onChange({
      ...value,
      items: value.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              columns: item.columns.map((column, innerIndex) =>
                innerIndex === columnIndex
                  ? {
                      ...column,
                      links: column.links.map((link, linkInnerIndex) =>
                        linkInnerIndex === linkIndex
                          ? { ...link, ...patch }
                          : link,
                      ),
                    }
                  : column,
              ),
            }
          : item,
      ),
    });
  const addItem = () =>
    onChange({
      ...value,
      items: [
        ...value.items,
        {
          id: "item-" + Date.now(),
          label: "\u65b0\u83dc\u5355",
          href: "/",
          columns: [],
        },
      ],
    });
  const removeItem = (index: number) =>
    onChange({
      ...value,
      items: value.items.filter((_, itemIndex) => itemIndex !== index),
    });
  const addColumn = (itemIndex: number) =>
    onChange({
      ...value,
      items: value.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              columns: [
                ...item.columns,
                { eyebrow: "\u65b0\u5206\u7ec4", links: [] },
              ],
            }
          : item,
      ),
    });
  const removeColumn = (itemIndex: number, columnIndex: number) =>
    onChange({
      ...value,
      items: value.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              columns: item.columns.filter(
                (_, innerIndex) => innerIndex !== columnIndex,
              ),
            }
          : item,
      ),
    });
  const addLink = (itemIndex: number, columnIndex: number) =>
    onChange({
      ...value,
      items: value.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              columns: item.columns.map((column, innerIndex) =>
                innerIndex === columnIndex
                  ? {
                      ...column,
                      links: [
                        ...column.links,
                        {
                          label: "\u65b0\u94fe\u63a5",
                          href: "/",
                          featured: false,
                        },
                      ],
                    }
                  : column,
              ),
            }
          : item,
      ),
    });
  const removeLink = (
    itemIndex: number,
    columnIndex: number,
    linkIndex: number,
  ) =>
    onChange({
      ...value,
      items: value.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              columns: item.columns.map((column, innerIndex) =>
                innerIndex === columnIndex
                  ? {
                      ...column,
                      links: column.links.filter(
                        (_, linkInnerIndex) => linkInnerIndex !== linkIndex,
                      ),
                    }
                  : column,
              ),
            }
          : item,
      ),
    });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">顶部菜单</p>
          <p className="text-sm text-slate-500">
            按页面上的显示顺序填写菜单、分组和链接。
          </p>
          <p className="mt-1 text-xs text-blue-600">
            链接地址规则：以 / 开头是本站页面；填写 http://、https:// 或 www.
            开头的网址会直接跳转到外部网站。
          </p>
        </div>
        <Button kind="soft" onClick={addItem}>
          <Plus size={15} />
          新增菜单
        </Button>
      </div>
      {value.items.map((item, itemIndex) => (
        <section
          key={item.id}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_auto] md:items-end">
            <Label label="菜单名称">
              <input
                value={item.label}
                onChange={(event) =>
                  updateItem(itemIndex, { label: event.target.value })
                }
                className={fields}
              />
            </Label>
            <Label label="菜单首页地址">
              <input
                value={item.href}
                onChange={(event) =>
                  updateItem(itemIndex, { href: event.target.value })
                }
                className={fields}
              />
            </Label>
            <Button kind="danger" onClick={() => removeItem(itemIndex)}>
              <Trash2 size={15} />
              删除菜单
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {item.columns.map((column, columnIndex) => (
              <div key={columnIndex} className="rounded-md bg-slate-50 p-3">
                <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                  <Label label="展开分组标题">
                    <input
                      value={column.eyebrow}
                      onChange={(event) =>
                        updateColumn(itemIndex, columnIndex, {
                          eyebrow: event.target.value,
                        })
                      }
                      className={fields}
                    />
                  </Label>
                  <Button
                    kind="danger"
                    onClick={() => removeColumn(itemIndex, columnIndex)}
                  >
                    <Trash2 size={15} />
                    删除分组
                  </Button>
                </div>
                <div className="mt-3 grid gap-2">
                  {column.links.map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="grid gap-2 md:grid-cols-[1fr_1.2fr_auto_auto] md:items-end"
                    >
                      <Label label="链接名称">
                        <input
                          value={link.label}
                          onChange={(event) =>
                            updateLink(itemIndex, columnIndex, linkIndex, {
                              label: event.target.value,
                            })
                          }
                          className={fields}
                        />
                      </Label>
                      <Label label="链接地址">
                        <input
                          value={link.href}
                          onChange={(event) =>
                            updateLink(itemIndex, columnIndex, linkIndex, {
                              href: event.target.value,
                            })
                          }
                          className={fields}
                        />
                      </Label>
                      <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={Boolean(link.featured)}
                          onChange={(event) =>
                            updateLink(itemIndex, columnIndex, linkIndex, {
                              featured: event.target.checked,
                            })
                          }
                        />
                        突出显示
                      </label>
                      <Button
                        kind="danger"
                        onClick={() =>
                          removeLink(itemIndex, columnIndex, linkIndex)
                        }
                      >
                        <Trash2 size={15} />
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button
                    kind="soft"
                    onClick={() => addLink(itemIndex, columnIndex)}
                  >
                    <Plus size={15} />
                    新增链接
                  </Button>
                </div>
              </div>
            ))}
            <Button kind="soft" onClick={() => addColumn(itemIndex)}>
              <Plus size={15} />
              新增展开分组
            </Button>
          </div>
        </section>
      ))}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={busy}>
          <Save size={16} />
          {busy ? "保存中..." : "保存导航"}
        </Button>
      </div>
    </div>
  );
}

function BackupPanel({
  onClose,
  announce,
}: {
  onClose: () => void;
  announce: (message: string) => void;
}) {
  async function download() {
    const response = await adminFetch("/api/admin/backup", { method: "POST" });
    if (!response.ok) {
      announce("创建备份失败。");
      return;
    }
    const data = await response.json();
    const fileResponse = await adminFetch(
      `/api/admin/backup?file=${encodeURIComponent(data.backup.name)}`,
    );
    if (!fileResponse.ok) {
      announce("备份已创建，但下载失败。");
      return;
    }
    const blob = await fileResponse.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.backup.name;
    link.click();
    URL.revokeObjectURL(url);
    announce("数据库备份已下载。");
    onClose();
  }
  return (
    <div>
      <div className="rounded-md bg-blue-50 p-4 text-sm leading-6 text-blue-800">
        备份文件包含产品、资讯、客户留言、页面内容、导航与系统设置。请将下载的
        SQLite 文件保存在受保护的位置。
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={download}>
          <Archive size={16} />
          下载数据库备份
        </Button>
      </div>
    </div>
  );
}
