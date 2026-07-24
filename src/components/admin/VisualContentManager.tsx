"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  ImageIcon,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type {
  AdminRole,
  ContentVersion,
  ContentWorkspace,
  PageMedia,
  SiteContent,
  SiteContentSection,
  SitePageContent,
  Testimonial,
} from "@/lib/content-types";
import type { Locale } from "@/lib/navigation";
import { adminFetch } from "@/lib/admin-fetch";

type PageKey = keyof SiteContent;
type EditorTarget =
  | { kind: "hero" }
  | { kind: "actions" }
  | { kind: "media" }
  | { kind: "section"; index: number }
  | { kind: "metrics" }
  | { kind: "faqs" }
  | { kind: "testimonials" }
  | { kind: "resources" }
  | { kind: "labels" };

type Props = {
  locale: Locale;
  role: AdminRole;
  initialContent: SiteContent;
  initialPage?: PageKey;
  onPublished: (content: SiteContent) => void;
  onOpenArea: (area: "brand" | "navigation" | "footer") => void;
  announce: (message: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const fieldClass =
  "min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const textareaClass = `${fieldClass} min-h-28 resize-y py-3`;

const pages: Array<{
  key: PageKey;
  name: string;
  path: string;
  group: "常用页面" | "内容页面" | "政策页面";
  description: string;
}> = [
  {
    key: "home",
    name: "首页",
    path: "",
    group: "常用页面",
    description: "首屏、产品展示、合作入口和业务数据",
  },
  {
    key: "products",
    name: "产品页",
    path: "/products",
    group: "常用页面",
    description: "产品总览标题、介绍、筛选文案和选购内容",
  },
  {
    key: "about",
    name: "关于我们",
    path: "/about",
    group: "常用页面",
    description: "公司介绍、产品理念和国际合作",
  },
  {
    key: "contact",
    name: "联系页",
    path: "/contact",
    group: "常用页面",
    description: "询盘页标题、介绍、按钮和业务数据",
  },
  {
    key: "services",
    name: "服务页",
    path: "/services",
    group: "内容页面",
    description: "批发、OEM、礼赠、售后和合作流程",
  },
  {
    key: "cases",
    name: "合作场景（常用）",
    path: "/cases",
    group: "常用页面",
    description: "修改首屏说明，以及零售分销、OEM / ODM、企业礼赠等场景卡片",
  },
  {
    key: "faq",
    name: "FAQ",
    path: "/faq",
    group: "内容页面",
    description: "产品、报价、合作和售后常见问题",
  },
  {
    key: "news",
    name: "用户评价",
    path: "/news",
    group: "内容页面",
    description: "客户评价、评分、身份信息和评价图片",
  },
  {
    key: "support",
    name: "支持页",
    path: "/support",
    group: "内容页面",
    description: "充电、电池保养、保修、FAQ 和服务资源",
  },
  {
    key: "shop",
    name: "采购与报价",
    path: "/shop",
    group: "内容页面",
    description: "采购说明、公告和报价入口",
  },
  {
    key: "privacy",
    name: "隐私政策",
    path: "/privacy",
    group: "政策页面",
    description: "隐私说明、更新时间和政策段落",
  },
  {
    key: "terms",
    name: "使用条款",
    path: "/terms",
    group: "政策页面",
    description: "网站条款、合理使用和责任说明",
  },
];

const sectionNames: Record<string, string> = {
  "hero-color": "首页第 2 屏：彩色系列",
  "hero-orange": "首页第 3 屏：橙色特别款",
  "promo-blue": "首页展示：蓝钛金属款",
  "promo-pastel": "首页展示：马卡龙配色",
  "promo-orange": "首页展示：橙色",
  "promo-rose": "首页展示：玫瑰粉",
  "promo-usb": "首页展示：USB-C",
  "promo-multi": "首页展示：多彩系列",
  company: "公司介绍",
  philosophy: "产品理念",
  cooperation: "国际合作",
  charging: "充电基础",
  battery: "电池保养",
  warranty: "保修支持",
  distribution: "批发与分销",
  oem: "OEM / ODM 项目",
  gifting: "企业礼赠",
  support: "产品与售后支持",
  "process-1": "合作流程第 1 步",
  "process-2": "合作流程第 2 步",
  "process-3": "合作流程第 3 步",
  "process-4": "合作流程第 4 步",
  retail: "零售分销场景",
  catalog: "产品总览",
  guides: "选购指南",
  daily: "日常随身",
  help: "联系销售",
  information: "我们收集的信息",
  usage: "信息用途",
  storage: "保存与联系",
  website: "网站内容",
  acceptable: "合理使用",
  liability: "责任与更新",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function same(left: unknown, right: unknown) {
  const stable = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [
            key,
            stable((value as Record<string, unknown>)[key]),
          ]),
      );
    return value;
  };
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function validHref(value?: string) {
  if (!value) return true;
  return (
    (value.startsWith("/") && !value.startsWith("//")) ||
    /^(?:https?:\/\/|mailto:|tel:|#)/i.test(value)
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {help ? (
        <span className="text-xs font-normal leading-5 text-slate-500">
          {help}
        </span>
      ) : null}
      {children}
    </label>
  );
}

function SmallButton({
  children,
  onClick,
  primary = false,
  danger = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={reduceMotion || disabled ? undefined : { y: -1 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : danger
            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </motion.button>
  );
}

function pageUrl(locale: Locale, key: PageKey) {
  const page = pages.find((item) => item.key === key);
  return `/${locale}${page?.path ?? ""}`;
}

function moduleTitle(target: EditorTarget, section?: SiteContentSection) {
  if (target.kind === "hero") return "首屏标题与介绍";
  if (target.kind === "actions") return "首屏按钮";
  if (target.kind === "media") return "首屏图片或视频";
  if (target.kind === "metrics") return "业务数据";
  if (target.kind === "faqs") return "常见问题";
  if (target.kind === "testimonials") return "用户评价";
  if (target.kind === "resources") return "服务资源";
  if (target.kind === "labels") return "高级交互文案";
  return sectionNames[section?.id ?? ""] || section?.title || "内容模块";
}

export function VisualContentManager({
  locale,
  role,
  initialContent,
  initialPage = "home",
  onPublished,
  onOpenArea,
  announce,
  onDirtyChange,
}: Props) {
  const [workspace, setWorkspace] = useState<ContentWorkspace>({
    published: initialContent,
    draft: initialContent,
    hasDraft: false,
    draftUpdatedAt: "",
    publishedAt: "",
    versions: [],
  });
  const [selected, setSelected] = useState<PageKey>(initialPage);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">(
    "all",
  );
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [editorBaseline, setEditorBaseline] = useState<SitePageContent | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");
  const [compareOpen, setCompareOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    adminFetch(`/api/admin/site-content?locale=${locale}`)
      .then((response) => response.json())
      .then((data: ContentWorkspace) => {
        if (!active || !data?.published) return;
        setWorkspace(data);
        setDirty(false);
        setSaveState("saved");
      })
      .catch(() => announce("页面内容读取失败，请刷新后重试。"));
    return () => {
      active = false;
    };
  }, [announce, locale]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  async function saveDraft(silent = false, source = workspace.draft) {
    setSaveState("saving");
    try {
      const response = await adminFetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, content: source }),
      });
      const data = (await response.json()) as ContentWorkspace & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "草稿保存失败。");
      setWorkspace(data);
      setDirty(false);
      setSaveState("saved");
      if (!silent) announce("草稿已保存，前台尚未发布。");
      return data;
    } catch (error) {
      setSaveState("error");
      if (!silent)
        announce(error instanceof Error ? error.message : "草稿保存失败。");
      return null;
    }
  }

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveDraft(true);
    }, 1600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // saveDraft deliberately uses the latest draft snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, workspace.draft]);

  const updateDraft = (next: SiteContent) => {
    setWorkspace((current) => ({
      ...current,
      draft: next,
      hasDraft: !same(next, current.published),
    }));
    setDirty(true);
    setSaveState("unsaved");
  };

  const updatePage = (next: SitePageContent) =>
    updateDraft({ ...workspace.draft, [selected]: next });

  const currentPage = workspace.draft[selected];
  const publishedPage = workspace.published[selected];
  const selectedMeta = pages.find((item) => item.key === selected)!;
  const pageHasDraft = !same(currentPage, publishedPage);

  const visiblePages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return pages.filter((page) => {
      const matchesQuery =
        !normalized ||
        `${page.name} ${page.description} ${page.path}`
          .toLowerCase()
          .includes(normalized);
      const changed = !same(
        workspace.draft[page.key],
        workspace.published[page.key],
      );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "draft" ? changed : !changed);
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, workspace]);

  const changedPages = pages.filter(
    (page) =>
      !same(workspace.draft[page.key], workspace.published[page.key]),
  );

  const openEditor = (target: EditorTarget) => {
    setEditorBaseline(clone(currentPage));
    setEditor(target);
  };

  const closeEditor = () => {
    if (
      editorBaseline &&
      !same(editorBaseline, currentPage) &&
      !window.confirm("当前模块还有未保存到草稿的修改，确定取消吗？")
    )
      return;
    if (editorBaseline && !same(editorBaseline, currentPage))
      updatePage(editorBaseline);
    setEditor(null);
    setEditorBaseline(null);
  };

  const finishEditor = async () => {
    const error = validatePage(currentPage);
    if (error) {
      announce(error);
      return;
    }
    const saved = await saveDraft(false);
    if (saved) {
      setEditor(null);
      setEditorBaseline(null);
    }
  };

  const preview = async () => {
    const saved = dirty ? await saveDraft(true) : workspace;
    if (!saved) return;
    window.open(`${pageUrl(locale, selected)}?preview=1`, "_blank", "noopener");
  };

  const publish = async () => {
    const error = validateContent(workspace.draft);
    if (error) {
      announce(error);
      return;
    }
    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, content: workspace.draft }),
      });
      const data = (await response.json()) as ContentWorkspace & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "发布失败。");
      setWorkspace(data);
      onPublished(data.published);
      setDirty(false);
      setSaveState("saved");
      setCompareOpen(false);
      announce("发布成功，前台已更新，并已保存上一版本。");
    } catch (error) {
      announce(error instanceof Error ? error.message : "发布失败。");
    } finally {
      setBusy(false);
    }
  };

  const restoreVersion = async (version: ContentVersion) => {
    if (
      !window.confirm(
        `确定将 ${new Date(version.createdAt).toLocaleString("zh-CN")} 的版本恢复为草稿吗？前台不会立即改变。`,
      )
    )
      return;
    const response = await adminFetch("/api/admin/site-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, versionId: version.id }),
    });
    const data = (await response.json()) as ContentWorkspace & {
      error?: string;
    };
    if (!response.ok) {
      announce(data.error || "版本恢复失败。");
      return;
    }
    setWorkspace(data);
    setDirty(false);
    announce("历史版本已恢复为草稿，请预览后再发布。");
  };

  const resetDraft = () => {
    if (!window.confirm("确定撤销全部未发布修改，恢复到当前线上版本吗？"))
      return;
    const next = clone(workspace.published);
    setWorkspace((current) => ({
      ...current,
      draft: next,
      hasDraft: false,
    }));
    setDirty(true);
    setSaveState("unsaved");
  };

  const moveSection = (from: number, to: number) => {
    const sections = [...(currentPage.sections ?? [])];
    if (to < 0 || to >= sections.length || from === to) return;
    const [item] = sections.splice(from, 1);
    sections.splice(to, 0, item);
    updatePage({ ...currentPage, sections });
  };

  const addSection = () => {
    const next: SiteContentSection = {
      id: `section-${Date.now()}`,
      visible: true,
      locked: false,
      title: "新内容模块",
      subtitle: "请点击编辑填写这部分内容。",
    };
    const sections = [...(currentPage.sections ?? []), next];
    updatePage({ ...currentPage, sections });
    openEditor({ kind: "section", index: sections.length - 1 });
  };

  const removeSection = (index: number) => {
    const section = currentPage.sections?.[index];
    if (!section || section.locked || role !== "owner") return;
    if (!window.confirm(`确定删除“${section.title}”模块吗？`)) return;
    updatePage({
      ...currentPage,
      sections: currentPage.sections?.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  return (
    <motion.section
      className="grid gap-5 lg:h-full lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.34, delay: reduceMotion ? 0 : 0.04 }}
      >
        <div>
          <p className="text-sm font-semibold text-blue-600">可视化页面编辑</p>
          <h1 className="mt-1 text-2xl font-semibold">选择页面，再编辑对应模块</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            当前语言：{locale === "cn" ? "中文站" : "英文站"}。修改先保存为草稿，确认预览无误后再发布，不会直接覆盖前台。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={resetDraft} disabled={!workspace.hasDraft && !dirty}>
            <RotateCcw size={16} />
            撤销草稿
          </SmallButton>
          <SmallButton onClick={preview}>
            <Eye size={16} />
            预览效果
          </SmallButton>
          <SmallButton
            primary
            disabled={!workspace.hasDraft && !dirty}
            onClick={() => setCompareOpen(true)}
          >
            <Check size={16} />
            检查并发布
          </SmallButton>
        </div>
      </motion.div>

      <div className="grid min-h-[720px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-full lg:min-h-0 lg:grid-cols-[270px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50/80 p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索页面"
              className={`${fieldClass} pl-9`}
              aria-label="搜索页面"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "draft" | "published",
              )
            }
            className={`${fieldClass} mt-2`}
            aria-label="页面状态筛选"
          >
            <option value="all">全部状态</option>
            <option value="draft">有未发布修改</option>
            <option value="published">已与前台同步</option>
          </select>

          <nav className="mt-5 grid gap-5" aria-label="页面列表">
            {(["常用页面", "内容页面", "政策页面"] as const).map((group) => {
              const groupPages = visiblePages.filter(
                (page) => page.group === group,
              );
              if (!groupPages.length) return null;
              return (
                <div key={group}>
                  <p className="mb-2 px-2 text-xs font-semibold text-slate-400">
                    {group}
                  </p>
                  <div className="grid gap-1">
                    {groupPages.map((page) => {
                      const changed = !same(
                        workspace.draft[page.key],
                        workspace.published[page.key],
                      );
                      return (
                        <motion.button
                          key={page.key}
                          type="button"
                          onClick={() => setSelected(page.key)}
                          layout
                          whileHover={reduceMotion ? undefined : { x: 2 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                          transition={{ duration: reduceMotion ? 0 : 0.18 }}
                          className={`flex min-h-12 items-center justify-between rounded-lg px-3 text-left text-sm transition ${
                            selected === page.key
                              ? "bg-blue-600 font-semibold text-white"
                              : "text-slate-700 hover:bg-white"
                          }`}
                        >
                          <span>{page.name}</span>
                          {changed ? (
                            <span
                              className={`size-2 rounded-full ${
                                selected === page.key
                                  ? "bg-white"
                                  : "bg-amber-500"
                              }`}
                              title="有草稿"
                            />
                          ) : (
                            <ChevronRight size={15} className="opacity-45" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="mb-2 px-2 text-xs font-semibold text-slate-400">
              全站公共区域
            </p>
            {[
              { id: "brand" as const, label: "品牌、登录图与注册图" },
              { id: "navigation" as const, label: "页头与导航" },
              { id: "footer" as const, label: "页尾与链接" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenArea(item.id)}
                className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-white"
              >
                {item.label}
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </aside>

        <motion.div
          key={selected}
          className="min-w-0 p-4 sm:p-6 lg:h-full lg:overflow-y-auto"
          initial={reduceMotion ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">{selectedMeta.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    pageHasDraft
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {pageHasDraft ? "有草稿" : "已发布"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {selectedMeta.description}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                前台位置：{pageUrl(locale, selected)}
              </p>
            </div>
            <a
              href={pageUrl(locale, selected)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              查看前台
              <ExternalLink size={15} />
            </a>
          </div>

          {selected === "cases" ? (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
              合作场景就在这里修改：首屏内容使用下面第一个“编辑”按钮；继续在右侧区域向下滑，可分别编辑“零售分销、OEM / ODM、企业礼赠”等场景模块。每个模块右上角都有独立“编辑”按钮。
            </div>
          ) : null}

          {workspace.hasDraft || dirty ? (
            <div
              role="status"
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
            >
              当前有未发布内容：公开网站仍显示上一版本。请先“预览效果”，确认无误后点击顶部“检查并发布”。
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={saveState}
                className="inline-flex items-center gap-2 text-slate-600"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              >
                {saveState === "saving" ? (
                  <Clock3 size={16} className="animate-pulse text-blue-600" />
                ) : saveState === "error" ? (
                  <X size={16} className="text-rose-600" />
                ) : (
                  <Check size={16} className="text-emerald-600" />
                )}
                {saveState === "saving"
                  ? "正在自动保存草稿…"
                  : saveState === "unsaved"
                    ? "修改将在短时间内自动保存"
                    : saveState === "error"
                      ? "自动保存失败"
                      : workspace.draftUpdatedAt
                        ? `草稿已保存于 ${new Date(workspace.draftUpdatedAt).toLocaleTimeString("zh-CN")}`
                        : "当前没有未保存修改"}
              </motion.span>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => void saveDraft(false)}
              className="font-semibold text-blue-600 hover:underline"
            >
              立即保存草稿
            </button>
          </div>

          <motion.div
            className="mt-5 grid gap-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: reduceMotion ? 0 : 0.045,
                  delayChildren: reduceMotion ? 0 : 0.04,
                },
              },
            }}
          >
            <ModuleCard
              icon={<LayoutTemplate size={20} />}
              title="首屏标题与介绍"
              location="页面顶部首屏"
              usage="编辑页面小标题、主标题和介绍文字"
              current={currentPage.title || "未填写标题"}
              onEdit={() => openEditor({ kind: "hero" })}
              required
              delay={0.02}
            />
            <ModuleCard
              icon={<FileText size={20} />}
              title="首屏按钮"
              location="首屏标题下方"
              usage="修改按钮名称、链接和打开方式"
              current={
                [currentPage.primaryLabel, currentPage.secondaryLabel]
                  .filter(Boolean)
                  .join("、") || "当前未显示按钮"
              }
              onEdit={() => openEditor({ kind: "actions" })}
              required
              delay={0.06}
            />
            <ModuleCard
              icon={<ImageIcon size={20} />}
              title="首屏图片或视频"
              location="首屏视觉区域"
              usage="上传、替换、裁剪焦点、预览或移除媒体"
              current={currentPage.media?.src || "当前未设置独立媒体"}
              onEdit={() => openEditor({ kind: "media" })}
              required
              delay={0.1}
            />

            {(currentPage.sections ?? []).map((section, index) => (
              <motion.div
                key={`${section.id}-${index}`}
                layout
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) moveSection(dragIndex, index);
                  setDragIndex(null);
                }}
                animate={{
                  opacity: dragIndex === index ? 0.5 : 1,
                  scale: dragIndex === index && !reduceMotion ? 0.99 : 1,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  layout: { duration: reduceMotion ? 0 : 0.26 },
                }}
              >
                <ModuleCard
                  icon={<GripVertical size={20} />}
                  title={sectionNames[section.id] || section.title || `内容模块 ${index + 1}`}
                  location={`页面内容第 ${index + 1} 个模块`}
                  usage="文字、图片、按钮和项目列表可分别修改"
                  current={section.title || "未填写标题"}
                  onEdit={() => openEditor({ kind: "section", index })}
                  hidden={section.visible === false}
                  delay={0.12 + index * 0.035}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          updatePage({
                            ...currentPage,
                            sections: currentPage.sections?.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, visible: item.visible === false }
                                : item,
                            ),
                          })
                        }
                        className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                        aria-label={section.visible === false ? "显示模块" : "隐藏模块"}
                        title={section.visible === false ? "显示模块" : "隐藏模块"}
                      >
                        {section.visible === false ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, index - 1)}
                        disabled={index === 0}
                        className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                        aria-label="向上移动"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, index + 1)}
                        disabled={index === (currentPage.sections?.length ?? 0) - 1}
                        className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                        aria-label="向下移动"
                      >
                        <ArrowDown size={15} />
                      </button>
                      {!section.locked && role === "owner" ? (
                        <button
                          type="button"
                          onClick={() => removeSection(index)}
                          className="grid size-9 place-items-center rounded-lg bg-rose-50 text-rose-600"
                          aria-label="删除自定义模块"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </>
                  }
                />
              </motion.div>
            ))}

            <motion.button
              type="button"
              onClick={addSection}
              variants={{
                hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Plus size={17} />
              新增普通内容模块
            </motion.button>

            {(currentPage.metrics?.length || ["home", "about", "contact"].includes(selected)) ? (
              <ModuleCard
                icon={<FileText size={20} />}
                title="业务数据"
                location="页面内容下方"
                usage="修改数据值与对应说明"
                current={`${currentPage.metrics?.length ?? 0} 项数据`}
                onEdit={() => openEditor({ kind: "metrics" })}
              />
            ) : null}
            {(currentPage.faqs?.length || ["faq", "support"].includes(selected)) ? (
              <ModuleCard
                icon={<FileText size={20} />}
                title="FAQ 常见问题"
                location="页面 FAQ 区域"
                usage="逐条修改问题与回答，可新增和排序"
                current={`${currentPage.faqs?.length ?? 0} 个问题`}
                onEdit={() => openEditor({ kind: "faqs" })}
              />
            ) : null}
            {selected === "news" ? (
              <ModuleCard
                icon={<Star size={20} />}
                title="用户评价"
                location="用户评价页面主体"
                usage="新增、修改、排序或隐藏评价，并上传评价人头像或案例图片"
                current={`${currentPage.testimonials?.length ?? 0} 条评价`}
                onEdit={() => openEditor({ kind: "testimonials" })}
              />
            ) : null}
            {(currentPage.resources?.length || selected === "support") ? (
              <ModuleCard
                icon={<FileText size={20} />}
                title="服务资源"
                location="页面服务资源区"
                usage="修改资源标题、说明和按钮"
                current={`${currentPage.resources?.length ?? 0} 项资源`}
                onEdit={() => openEditor({ kind: "resources" })}
              />
            ) : null}
          </motion.div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setAdvancedOpen((value) => !value)}
              aria-expanded={advancedOpen}
              className="flex min-h-14 w-full items-center justify-between px-4 text-left font-semibold"
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 size={18} />
                高级设置与版本记录
              </span>
              <ChevronRight
                size={17}
                className={`transition ${advancedOpen ? "rotate-90" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {advancedOpen ? (
                <motion.div
                  key="advanced-settings"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="overflow-hidden"
                >
            <div className="grid gap-4 border-t border-slate-200 p-4">
              {currentPage.labels &&
              Object.keys(currentPage.labels).length ? (
                <ModuleCard
                  icon={<Settings2 size={20} />}
                  title="交互文案"
                  location="搜索、筛选和状态提示"
                  usage="普通编辑员可修改显示文字；不展示代码或字段名"
                  current={`${Object.keys(currentPage.labels).length} 项`}
                  onEdit={() => openEditor({ kind: "labels" })}
                />
              ) : null}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold">历史发布版本</h3>
                <p className="mt-1 text-sm text-slate-500">
                  每次发布前都会自动保存上一版本，恢复后先进入草稿。
                </p>
                <div className="mt-4 grid gap-2">
                  {workspace.versions.length ? (
                    workspace.versions.slice(0, 10).map((version) => (
                      <div
                        key={version.id}
                        className="flex flex-col justify-between gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="text-sm">
                          <p className="font-medium">
                            {new Date(version.createdAt).toLocaleString("zh-CN")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            发布人：{version.actor}
                          </p>
                        </div>
                        <SmallButton onClick={() => void restoreVersion(version)}>
                          <RotateCcw size={15} />
                          恢复为草稿
                        </SmallButton>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                      还没有历史版本；完成下一次发布后会自动生成。
                    </p>
                  )}
                </div>
              </div>
            </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {editor ? (
          <EditorDrawer
            target={editor}
            page={currentPage}
            role={role}
            onChange={updatePage}
            onCancel={closeEditor}
            onSave={() => void finishEditor()}
            onPreview={() => void preview()}
            saving={saveState === "saving"}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {compareOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="发布前改动对比"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
          <motion.div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.985 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <p className="text-sm font-semibold text-blue-600">发布前确认</p>
                <h2 className="mt-1 text-xl font-semibold">本次将更新哪些页面？</h2>
              </div>
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                className="grid size-10 place-items-center rounded-lg bg-slate-100"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {changedPages.length ? (
                <div className="grid gap-3">
                  {changedPages.map((page) => {
                    const before = workspace.published[page.key];
                    const after = workspace.draft[page.key];
                    return (
                      <article
                        key={page.key}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <h3 className="font-semibold">{page.name}</h3>
                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          <div className="rounded-lg bg-rose-50 p-3">
                            <p className="text-xs font-semibold text-rose-700">
                              当前线上
                            </p>
                            <p className="mt-2 text-slate-700">
                              {before.title || "无标题"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 p-3">
                            <p className="text-xs font-semibold text-emerald-700">
                              即将发布
                            </p>
                            <p className="mt-2 text-slate-700">
                              {after.title || "无标题"}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          内容模块：{before.sections?.length ?? 0} →{" "}
                          {after.sections?.length ?? 0}；FAQ：{before.faqs?.length ?? 0} →{" "}
                          {after.faqs?.length ?? 0}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  当前没有需要发布的修改。
                </p>
              )}
            </div>
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
              <SmallButton onClick={() => setCompareOpen(false)}>
                取消
              </SmallButton>
              <SmallButton onClick={preview}>
                <Eye size={16} />
                先预览
              </SmallButton>
              <SmallButton
                primary
                disabled={!changedPages.length || busy}
                onClick={() => void publish()}
              >
                <Check size={16} />
                {busy ? "正在发布…" : "确认发布"}
              </SmallButton>
            </div>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function ModuleCard({
  icon,
  title,
  location,
  usage,
  current,
  onEdit,
  actions,
  hidden = false,
  required = false,
  delay = 0,
}: {
  icon: ReactNode;
  title: string;
  location: string;
  usage: string;
  current: string;
  onEdit: () => void;
  actions?: ReactNode;
  hidden?: boolean;
  required?: boolean;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        reduceMotion || hidden
          ? undefined
          : { y: -2, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)" }
      }
      transition={{
        duration: reduceMotion ? 0 : 0.24,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: reduceMotion ? 0 : 0.26 },
      }}
      className={`rounded-xl border p-4 transition ${
        hidden
          ? "border-dashed border-slate-300 bg-slate-50 opacity-70"
          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {required ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  系统必要模块
                </span>
              ) : null}
              {hidden ? (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  前台已隐藏
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-medium text-blue-600">
              前台位置：{location}
            </p>
            <p className="mt-2 text-sm text-slate-500">{usage}</p>
            <p className="mt-2 truncate text-sm text-slate-700">
              当前内容：{current}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          <SmallButton onClick={onEdit}>
            编辑
            <ChevronRight size={15} />
          </SmallButton>
        </div>
      </div>
    </motion.article>
  );
}

function EditorDrawer({
  target,
  page,
  role,
  onChange,
  onCancel,
  onSave,
  onPreview,
  saving,
}: {
  target: EditorTarget;
  page: SitePageContent;
  role: AdminRole;
  onChange: (value: SitePageContent) => void;
  onCancel: () => void;
  onSave: () => void;
  onPreview: () => void;
  saving: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const section =
    target.kind === "section" ? page.sections?.[target.index] : undefined;
  const updateSection = (patch: Partial<SiteContentSection>) => {
    if (target.kind !== "section") return;
    onChange({
      ...page,
      sections: page.sections?.map((item, index) =>
        index === target.index ? { ...item, ...patch } : item,
      ),
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[75] bg-slate-950/35 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`编辑${moduleTitle(target, section)}`}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
        aria-label="关闭编辑器"
      />
      <motion.aside
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl"
        initial={reduceMotion ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={reduceMotion ? undefined : { x: "100%" }}
        transition={{
          duration: reduceMotion ? 0 : 0.36,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">模块编辑</p>
            <h2 className="mt-1 text-xl font-semibold">
              {moduleTitle(target, section)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              这里只显示当前模块相关内容，保存后先进入草稿。
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid size-10 place-items-center rounded-lg bg-slate-100"
            aria-label="取消修改"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {target.kind === "hero" ? (
            <div className="grid gap-5">
              <Field
                label="页面小标题"
                help="显示在主标题上方，用于说明品牌或页面类别。"
              >
                <input
                  value={page.eyebrow}
                  maxLength={200}
                  onChange={(event) =>
                    onChange({ ...page, eyebrow: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field
                label="页面主标题"
                help="前台首屏最醒目的文字，不能为空，建议不超过 30 个汉字。"
              >
                <input
                  value={page.title}
                  required
                  maxLength={300}
                  onChange={(event) =>
                    onChange({ ...page, title: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field
                label="介绍文字"
                help="显示在主标题下方，建议用 1–3 句话说明页面用途。"
              >
                <textarea
                  value={page.subtitle}
                  maxLength={2000}
                  onChange={(event) =>
                    onChange({ ...page, subtitle: event.target.value })
                  }
                  className={textareaClass}
                />
              </Field>
              <Field
                label="页面公告"
                help="可选；显示在页面顶部的信息条，留空即不显示。"
              >
                <input
                  value={page.notice ?? ""}
                  maxLength={500}
                  onChange={(event) =>
                    onChange({ ...page, notice: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
            </div>
          ) : null}

          {target.kind === "actions" ? (
            <ActionFields
              value={page}
              role={role}
              onChange={(patch) => onChange({ ...page, ...patch })}
            />
          ) : null}

          {target.kind === "media" ? (
            <MediaEditor
              value={page.media}
              onChange={(media) => onChange({ ...page, media })}
            />
          ) : null}

          {target.kind === "section" && section ? (
            <div className="grid gap-5">
              <Field label="模块小标题" help="可选，显示在内容标题上方。">
                <input
                  value={section.eyebrow ?? ""}
                  maxLength={160}
                  onChange={(event) =>
                    updateSection({ eyebrow: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field
                label="模块标题"
                help="此内容区的主要标题，显示在当前模块内。"
              >
                <input
                  value={section.title}
                  maxLength={300}
                  onChange={(event) =>
                    updateSection({ title: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field label="模块介绍" help="标题下方的正文说明。">
                <textarea
                  value={section.subtitle}
                  maxLength={2000}
                  onChange={(event) =>
                    updateSection({ subtitle: event.target.value })
                  }
                  className={textareaClass}
                />
              </Field>
              <ListEditor
                value={section.items ?? []}
                onChange={(items) => updateSection({ items })}
              />
              <ActionFields
                value={section}
                role={role}
                onChange={updateSection}
              />
              <MediaEditor
                value={section.media}
                onChange={(media) => updateSection({ media })}
              />
            </div>
          ) : null}

          {target.kind === "metrics" ? (
            <MetricsEditor
              value={page.metrics ?? []}
              onChange={(metrics) => onChange({ ...page, metrics })}
            />
          ) : null}

          {target.kind === "faqs" ? (
            <FaqEditor
              value={page.faqs ?? []}
              onChange={(faqs) => onChange({ ...page, faqs })}
            />
          ) : null}

          {target.kind === "testimonials" ? (
            <TestimonialEditor
              value={page.testimonials ?? []}
              role={role}
              onChange={(testimonials) =>
                onChange({ ...page, testimonials })
              }
            />
          ) : null}

          {target.kind === "resources" ? (
            <ResourceEditor
              value={page.resources ?? []}
              role={role}
              onChange={(resources) => onChange({ ...page, resources })}
            />
          ) : null}

          {target.kind === "labels" ? (
            <LabelEditor
              value={page.labels ?? {}}
              onChange={(labels) => onChange({ ...page, labels })}
            />
          ) : null}
        </div>
        <footer className="border-t border-slate-200 bg-white p-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <SmallButton onClick={onCancel}>取消修改</SmallButton>
            <SmallButton onClick={onPreview}>
              <Eye size={16} />
              预览效果
            </SmallButton>
            <SmallButton primary onClick={onSave} disabled={saving}>
              <Save size={16} />
              {saving ? "正在保存…" : "保存草稿"}
            </SmallButton>
          </div>
        </footer>
      </motion.aside>
    </motion.div>
  );
}

function ActionFields({
  value,
  role,
  onChange,
}: {
  value: Pick<
    SitePageContent,
    | "primaryLabel"
    | "primaryHref"
    | "primaryTarget"
    | "secondaryLabel"
    | "secondaryHref"
    | "secondaryTarget"
  >;
  role: AdminRole;
  onChange: (patch: Partial<SitePageContent>) => void;
}) {
  return (
    <div className="grid gap-5">
      {(["primary", "secondary"] as const).map((kind) => {
        const labelKey = `${kind}Label` as const;
        const hrefKey = `${kind}Href` as const;
        const targetKey = `${kind}Target` as const;
        return (
          <section
            key={kind}
            className="grid gap-4 rounded-xl border border-slate-200 p-4"
          >
            <h3 className="font-semibold">
              {kind === "primary" ? "主按钮" : "次按钮"}
            </h3>
            <Field label="按钮显示名称" help="留空时前台不显示此按钮。">
              <input
                value={value[labelKey] ?? ""}
                maxLength={160}
                onChange={(event) =>
                  onChange({ [labelKey]: event.target.value })
                }
                className={fieldClass}
              />
            </Field>
            <Field
              label="点击后前往"
              help={
                role === "editor"
                  ? "普通编辑员不能修改链接，请联系网站管理员。"
                  : "站内页面填写 /products，外部链接填写完整 https:// 地址。"
              }
            >
              <input
                value={value[hrefKey] ?? ""}
                disabled={role === "editor"}
                onChange={(event) =>
                  onChange({ [hrefKey]: event.target.value })
                }
                className={fieldClass}
                placeholder="/products"
              />
            </Field>
            <Field label="打开方式">
              <select
                value={value[targetKey] ?? "_self"}
                disabled={role === "editor"}
                onChange={(event) =>
                  onChange({
                    [targetKey]: event.target.value as "_self" | "_blank",
                  })
                }
                className={fieldClass}
              >
                <option value="_self">在当前页面打开</option>
                <option value="_blank">在新窗口打开</option>
              </select>
            </Field>
          </section>
        );
      })}
    </div>
  );
}

function TestimonialEditor({
  value,
  role,
  onChange,
}: {
  value: Testimonial[];
  role: AdminRole;
  onChange: (value: Testimonial[]) => void;
}) {
  const update = (index: number, patch: Partial<Testimonial>) =>
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const add = () =>
    onChange([
      ...value,
      {
        id: `review-${Date.now()}`,
        visible: true,
        name: "",
        role: "",
        company: "",
        country: "",
        rating: 5,
        quote: "",
      },
    ]);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-800">
        只发布已获得授权的真实评价。头像只用于评价人身份区，产品评价图片会显示在评价卡片和详情页；保存草稿后还要点击“检查并发布”，公开前台才会更新。
      </div>
      {value.length ? (
        value.map((item, index) => (
          <section
            key={item.id}
            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  评价 {index + 1}
                  {item.name ? ` · ${item.name}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  前台按这里的顺序展示
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                  aria-label="向上移动评价"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === value.length - 1}
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                  aria-label="向下移动评价"
                >
                  <ArrowDown size={15} />
                </button>
                {role === "owner" ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.confirm("确定删除这条用户评价吗？") &&
                      onChange(
                        value.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                    className="grid size-9 place-items-center rounded-lg bg-rose-50 text-rose-600"
                    aria-label="删除评价"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            </div>

            <label className="flex min-h-11 items-center justify-between rounded-lg bg-slate-50 px-3 text-sm font-medium text-slate-700">
              <span>在前台显示这条评价</span>
              <input
                type="checkbox"
                checked={item.visible !== false}
                onChange={(event) =>
                  update(index, { visible: event.target.checked })
                }
                className="size-4 accent-blue-600"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="评价人姓名"
                help="必填。可填写经授权公开的姓名或称呼。"
              >
                <input
                  value={item.name}
                  required
                  maxLength={160}
                  onChange={(event) =>
                    update(index, { name: event.target.value })
                  }
                  className={fieldClass}
                  placeholder="例如：王女士"
                />
              </Field>
              <Field label="评分" help="前台以星级显示。">
                <select
                  value={item.rating}
                  onChange={(event) =>
                    update(index, { rating: Number(event.target.value) })
                  }
                  className={fieldClass}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} 星
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="身份或职位" help="例如：采购经理、零售店主、用户。">
                <input
                  value={item.role ?? ""}
                  maxLength={160}
                  onChange={(event) =>
                    update(index, { role: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field label="公司或机构" help="可选，只填写允许公开的信息。">
                <input
                  value={item.company ?? ""}
                  maxLength={200}
                  onChange={(event) =>
                    update(index, { company: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
              <Field label="国家或地区" help="可选，用于说明评价来源。">
                <input
                  value={item.country ?? ""}
                  maxLength={120}
                  onChange={(event) =>
                    update(index, { country: event.target.value })
                  }
                  className={fieldClass}
                />
              </Field>
            </div>

            <Field
              label="评价内容"
              help="必填。请保持原意，不要添加未经客户确认的宣传描述。"
            >
              <textarea
                value={item.quote}
                required
                maxLength={3000}
                onChange={(event) =>
                  update(index, { quote: event.target.value })
                }
                className={textareaClass}
              />
            </Field>

            <section className="grid gap-3 rounded-xl border border-slate-200 p-4">
              <div>
                <h3 className="font-semibold">用户头像</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  前台位置：评价人姓名旁边的圆形头像。没有头像时会自动显示人物图标，不影响发布。
                </p>
              </div>
              <MediaEditor
                value={item.avatar}
                imageOnly
                suggestion="建议尺寸：800×800 像素正方形图片，人物或品牌主体放在画面中央。"
                onChange={(avatar) => update(index, { avatar })}
              />
            </section>

            <TestimonialImagesEditor
              value={item.images ?? (item.media ? [item.media] : [])}
              onChange={(images) =>
                update(index, { images, media: undefined })
              }
            />
          </section>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          还没有用户评价。点击下方按钮添加第一条真实评价。
        </div>
      )}
      <button
        type="button"
        onClick={add}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 font-semibold text-blue-700 transition hover:bg-blue-50"
      >
        <Plus size={17} />
        新增用户评价
      </button>
    </div>
  );
}

function TestimonialImagesEditor({
  value,
  onChange,
}: {
  value: PageMedia[];
  onChange: (value: PageMedia[]) => void;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <section className="grid gap-4 rounded-xl border border-slate-200 p-4">
      <div>
        <h3 className="font-semibold">产品评价图片</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          前台位置：评价列表卡片和评价详情页。可上传产品实拍、开箱、包装或使用场景图，最多 8 张。
        </p>
      </div>
      {value.map((media, imageIndex) => (
        <div
          key={`${media.src}-${imageIndex}`}
          className="grid gap-3 rounded-xl bg-slate-50 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">
              第 {imageIndex + 1} 张产品图
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => move(imageIndex, imageIndex - 1)}
                disabled={imageIndex === 0}
                className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-30"
                aria-label={`向前移动第 ${imageIndex + 1} 张产品图`}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => move(imageIndex, imageIndex + 1)}
                disabled={imageIndex === value.length - 1}
                className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-30"
                aria-label={`向后移动第 ${imageIndex + 1} 张产品图`}
              >
                <ArrowDown size={15} />
              </button>
            </div>
          </div>
          <MediaEditor
            value={media}
            imageOnly
            suggestion="建议尺寸：横图 1600×1200 像素以上；可调整裁剪焦点，并填写准确的图片说明。"
            onChange={(nextMedia) =>
              onChange(
                nextMedia
                  ? value.map((item, index) =>
                      index === imageIndex ? nextMedia : item,
                    )
                  : value.filter((_, index) => index !== imageIndex),
              )
            }
          />
        </div>
      ))}
      {value.length < 8 ? (
        <div className="grid gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-3">
          <p className="text-sm font-semibold text-blue-800">
            {value.length ? "继续添加产品图片" : "上传第一张产品评价图片"}
          </p>
          <MediaEditor
            imageOnly
            suggestion="上传后会自动加入本条评价；图片仍需保存草稿并发布后才会出现在公开前台。"
            onChange={(media) => {
              if (media) onChange([...value, media]);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function MediaEditor({
  value,
  onChange,
  suggestion = "建议尺寸：横图 1600×900 像素以上，WEBP 或 JPG；重要主体尽量放在画面中央。上传后可调整裁剪焦点。",
  imageOnly = false,
}: {
  value?: PageMedia;
  onChange: (value?: PageMedia) => void;
  suggestion?: string;
  imageOnly?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const position = value?.position || "50% 50%";
  const [x, y] = position
    .split(" ")
    .map((item) => Number.parseInt(item, 10) || 50);

  const upload = async (file: File) => {
    if (imageOnly && !file.type.startsWith("image/")) {
      window.alert("用户评价只能上传图片文件。");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await adminFetch("/api/admin/media", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "上传失败。");
      onChange({
        type: file.type.startsWith("video/") ? "video" : "image",
        src: data.url,
        alt: value?.alt ?? "",
        position: value?.position ?? "50% 50%",
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <div className="relative aspect-video">
          {value?.src ? (
            value.type === "video" ? (
              <video
                src={value.src}
                muted
                controls
                className="h-full w-full object-cover"
                style={{ objectPosition: value.position || "50% 50%" }}
              />
            ) : (
              <Image
                unoptimized
                src={value.src}
                alt={value.alt || "当前图片预览"}
                fill
                sizes="640px"
                className="object-cover"
                style={{ objectPosition: value.position || "50% 50%" }}
              />
            )
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-500">
              {imageOnly ? "当前没有图片" : "当前没有图片或视频"}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-800">
        {suggestion}
      </div>
      <Field
        label={
          value?.src
            ? imageOnly
              ? "替换图片"
              : "替换图片或视频"
            : imageOnly
              ? "上传图片"
              : "上传图片或视频"
        }
      >
        <input
          type="file"
          accept={
            imageOnly
              ? "image/jpeg,image/png,image/webp,image/gif"
              : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
          }
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.currentTarget.value = "";
          }}
          className={`${fieldClass} py-2`}
        />
      </Field>
      {value?.src ? (
        <>
          <Field
            label="图片说明"
            help="用于无障碍阅读和搜索引擎理解图片内容。"
          >
            <input
              value={value.alt ?? ""}
              maxLength={240}
              onChange={(event) =>
                onChange({ ...value, alt: event.target.value })
              }
              className={fieldClass}
            />
          </Field>
          {value.type === "image" ? (
            <section className="grid gap-4 rounded-xl border border-slate-200 p-4">
              <div>
                <h3 className="font-semibold">裁剪焦点</h3>
                <p className="mt-1 text-sm text-slate-500">
                  调整画面在不同屏幕裁剪时优先保留的位置，不修改原图文件。
                </p>
              </div>
              <Field label={`水平位置：${x}%`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={x}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      position: `${event.target.value}% ${y}%`,
                    })
                  }
                />
              </Field>
              <Field label={`垂直位置：${y}%`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={y}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      position: `${x}% ${event.target.value}%`,
                    })
                  }
                />
              </Field>
            </section>
          ) : null}
          <SmallButton danger onClick={() => onChange(undefined)}>
            <Trash2 size={15} />
            从此模块移除
          </SmallButton>
        </>
      ) : null}
    </div>
  );
}

function ListEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <section className="grid gap-3 rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">项目列表</h3>
          <p className="mt-1 text-sm text-slate-500">
            用于服务要点、场景需求等短句列表。
          </p>
        </div>
        <SmallButton onClick={() => onChange([...value, ""])}>
          <Plus size={15} />
          新增
        </SmallButton>
      </div>
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            value={item}
            maxLength={300}
            onChange={(event) =>
              onChange(
                value.map((current, itemIndex) =>
                  itemIndex === index ? event.target.value : current,
                ),
              )
            }
            className={fieldClass}
            aria-label={`列表内容 ${index + 1}`}
          />
          <button
            type="button"
            onClick={() =>
              onChange(value.filter((_, itemIndex) => itemIndex !== index))
            }
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600"
            aria-label={`删除列表内容 ${index + 1}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </section>
  );
}

function MetricsEditor({
  value,
  onChange,
}: {
  value: Array<{ value: string; label: string }>;
  onChange: (value: Array<{ value: string; label: string }>) => void;
}) {
  return (
    <div className="grid gap-3">
      {value.map((item, index) => (
        <section key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4">
          <Field label={`第 ${index + 1} 项数据`} help="例如：USB-C、全球、OEM / ODM。">
            <input
              value={item.value}
              maxLength={80}
              onChange={(event) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, value: event.target.value }
                      : current,
                  ),
                )
              }
              className={fieldClass}
            />
          </Field>
          <Field label="数据说明">
            <input
              value={item.label}
              maxLength={120}
              onChange={(event) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, label: event.target.value }
                      : current,
                  ),
                )
              }
              className={fieldClass}
            />
          </Field>
          <SmallButton danger onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 size={15} />
            删除此项
          </SmallButton>
        </section>
      ))}
      <SmallButton onClick={() => onChange([...value, { value: "", label: "" }])}>
        <Plus size={15} />
        新增数据
      </SmallButton>
    </div>
  );
}

function FaqEditor({
  value,
  onChange,
}: {
  value: Array<{ question: string; answer: string }>;
  onChange: (value: Array<{ question: string; answer: string }>) => void;
}) {
  return (
    <div className="grid gap-3">
      {value.map((item, index) => (
        <section key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">问题 {index + 1}</h3>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              className="grid size-9 place-items-center rounded-lg bg-rose-50 text-rose-600"
              aria-label={`删除问题 ${index + 1}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <Field label="问题">
            <input
              value={item.question}
              maxLength={300}
              onChange={(event) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, question: event.target.value }
                      : current,
                  ),
                )
              }
              className={fieldClass}
            />
          </Field>
          <Field label="回答" help="请使用明确、可验证的完整回答。">
            <textarea
              value={item.answer}
              maxLength={3000}
              onChange={(event) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, answer: event.target.value }
                      : current,
                  ),
                )
              }
              className={textareaClass}
            />
          </Field>
          <div className="flex gap-2">
            <SmallButton disabled={index === 0} onClick={() => {
              const next = [...value];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              onChange(next);
            }}>
              <ArrowUp size={14} />
              上移
            </SmallButton>
            <SmallButton disabled={index === value.length - 1} onClick={() => {
              const next = [...value];
              [next[index + 1], next[index]] = [next[index], next[index + 1]];
              onChange(next);
            }}>
              <ArrowDown size={14} />
              下移
            </SmallButton>
          </div>
        </section>
      ))}
      <SmallButton onClick={() => onChange([...value, { question: "", answer: "" }])}>
        <Plus size={15} />
        新增问题
      </SmallButton>
    </div>
  );
}

function ResourceEditor({
  value,
  role,
  onChange,
}: {
  value: Array<{
    title: string;
    description: string;
    label: string;
    href: string;
  }>;
  role: AdminRole;
  onChange: (
    value: Array<{
      title: string;
      description: string;
      label: string;
      href: string;
    }>,
  ) => void;
}) {
  const patch = (index: number, next: Partial<(typeof value)[number]>) =>
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item,
      ),
    );
  return (
    <div className="grid gap-3">
      {value.map((item, index) => (
        <section key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4">
          <Field label="资源标题">
            <input value={item.title} onChange={(event) => patch(index, { title: event.target.value })} className={fieldClass} />
          </Field>
          <Field label="资源说明">
            <textarea value={item.description} onChange={(event) => patch(index, { description: event.target.value })} className={textareaClass} />
          </Field>
          <Field label="按钮名称">
            <input value={item.label} onChange={(event) => patch(index, { label: event.target.value })} className={fieldClass} />
          </Field>
          <Field label="按钮链接" help={role === "editor" ? "普通编辑员不能修改链接。" : "填写站内路径或完整外部网址。"}>
            <input disabled={role === "editor"} value={item.href} onChange={(event) => patch(index, { href: event.target.value })} className={fieldClass} />
          </Field>
          <SmallButton danger onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 size={15} />
            删除资源
          </SmallButton>
        </section>
      ))}
      <SmallButton onClick={() => onChange([...value, { title: "", description: "", label: "了解更多", href: "/contact" }])}>
        <Plus size={15} />
        新增资源
      </SmallButton>
    </div>
  );
}

const friendlyLabels: Record<string, string> = {
  compare: "加入对比",
  selected: "已选择",
  clear: "清空",
  search: "搜索框提示",
  allProducts: "全部产品",
  featured: "精选产品",
  sortRecommended: "推荐排序",
  sortName: "名称排序",
  empty: "没有内容时的提示",
  quote: "联系销售",
  viewAll: "查看全部",
  share: "分享",
  shared: "复制成功",
  details: "产品详情",
  loading: "加载提示",
  allCategories: "全部分类",
  readMore: "阅读更多",
  back: "返回",
  moreStories: "更多资讯",
  readArticle: "阅读全文",
  faqTitle: "FAQ 标题",
  faqSearch: "问题搜索提示",
  faqEmpty: "FAQ 无结果提示",
  resourcesTitle: "服务资源标题",
  submit: "提交按钮",
  sending: "提交中提示",
  success: "成功提示",
  error: "失败提示",
  productPrefix: "产品询盘前缀",
  lastUpdated: "最后更新",
  print: "打印按钮",
  intro: "页面介绍段落",
  processTitle: "合作流程标题",
};

function LabelEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  return (
    <div className="grid gap-4">
      <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">
        这些是搜索、筛选、状态提示等辅助文字。这里只显示通俗名称，不展示代码字段。
      </p>
      {Object.entries(value).map(([key, label]) => (
        <Field key={key} label={friendlyLabels[key] || "辅助显示文字"}>
          <input
            value={label}
            maxLength={160}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.value })
            }
            className={fieldClass}
          />
        </Field>
      ))}
    </div>
  );
}

function validatePage(page: SitePageContent) {
  if (!page.title.trim()) return "页面主标题不能为空。";
  const links = [
    page.primaryHref,
    page.secondaryHref,
    ...(page.sections ?? []).flatMap((section) => [
      section.primaryHref,
      section.secondaryHref,
    ]),
    ...(page.resources ?? []).map((resource) => resource.href),
  ];
  if (links.some((href) => !validHref(href)))
    return "链接格式不正确：站内链接请以 / 开头，外部链接请填写完整 https:// 地址。";
  if (
    page.faqs?.some(
      (item) => !item.question.trim() || !item.answer.trim(),
    )
  )
    return "FAQ 的问题和回答都不能为空。";
  if (
    page.testimonials?.some(
      (item) =>
        !item.name.trim() ||
        !item.quote.trim() ||
        item.rating < 1 ||
        item.rating > 5,
    )
  )
    return "用户评价的评价人姓名、评价内容和 1–5 星评分不能为空。";
  return "";
}

function validateContent(content: SiteContent) {
  for (const page of pages) {
    const error = validatePage(content[page.key]);
    if (error) return `${page.name}：${error}`;
  }
  return "";
}
