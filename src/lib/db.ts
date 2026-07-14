import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { AccessLog, AdminRole, DashboardStats, FooterContent, Inquiry, LocalizedPost, LocalizedProduct, PageMedia, Post, Product, SecurityEvent, SiteContent, SiteContentSection } from "@/lib/content-types";
import { defaultNavigationByLocale, type Locale, type NavigationConfig } from "@/lib/navigation";

export type { DashboardStats, FooterContent, Inquiry, Post, Product, SiteContent, SiteContentSection } from "@/lib/content-types";

type ProductRow = Record<string, string | number>;
type PostRow = Record<string, string | number>;
type InquiryRow = Record<string, string | number>;

const dbPath = process.env.SZA_SQLITE_PATH ?? path.join(process.cwd(), "data", "sza-power.sqlite");
const productImages = [
  "/products/web/power-stack-blue.webp",
  "/products/web/power-stack-pink-vertical.webp",
  "/products/web/power-stack-orange.webp",
  "/products/web/power-stack-pink.webp",
  "/products/web/power-bank-orange.webp"
];

const defaultSiteContent: Record<Locale, SiteContent> = {
  en: {
    home: { eyebrow: "SZA POWER", title: "Pocket-size power. Polished for every day.", subtitle: "Compact mobile energy with thoughtful color, material, and USB-C charging.", primaryLabel: "Learn more", primaryHref: "/products/blue-titanium", secondaryLabel: "View all products", secondaryHref: "/products" },
    products: { eyebrow: "SZA POWER", title: "Compact power, in every finish.", subtitle: "Browse the current mobile power bank family, built around USB-C charging, clean surfaces, and retail-ready colors." },
    news: { eyebrow: "Newsroom", title: "Product stories and market notes.", subtitle: "Design, charging, and market updates from SZA POWER." },
    about: { eyebrow: "About SZA POWER", title: "Making mobile power feel personal.", subtitle: "SZA POWER designs compact power banks for daily charging, retail display, and international distribution." },
    support: { eyebrow: "Support", title: "Help for products, partners, and daily use.", subtitle: "Practical guidance for charging, product care, and commercial partners." },
    contact: { eyebrow: "Contact", title: "Tell us what you want to build.", subtitle: "Send a product, wholesale, OEM, or after-sales inquiry." },
    privacy: { eyebrow: "Privacy", title: "Your information stays purposeful.", subtitle: "This policy explains what information SZA POWER collects through this website and how it is used." },
    terms: { eyebrow: "Terms", title: "Clear terms for using this website.", subtitle: "By using this website, you agree to the following basic terms." }
  },
  cn: {
    home: { eyebrow: "SZA POWER", title: "\u53e3\u888b\u5c3a\u5bf8\uff0c\u968f\u8eab\u7535\u529b\uff0c\u7cbe\u6e5b\u5de5\u827a\u3002", subtitle: "\u4ee5\u8272\u5f69\u3001\u6750\u8d28\u4e0e USB-C \u5145\u7535\u6253\u9020\u7684\u7cbe\u81f4\u968f\u8eab\u7535\u529b\u3002", primaryLabel: "\u8fdb\u4e00\u6b65\u4e86\u89e3", primaryHref: "/products/blue-titanium", secondaryLabel: "\u67e5\u770b\u5168\u90e8\u4ea7\u54c1", secondaryHref: "/products" },
    products: { eyebrow: "SZA POWER", title: "\u6bcf\u4e00\u79cd\u914d\u8272\uff0c\u90fd\u662f\u968f\u8eab\u7535\u529b\u3002", subtitle: "\u6d4f\u89c8\u5f53\u524d\u79fb\u52a8\u7535\u6e90\u4ea7\u54c1\u7cfb\u5217\uff1aUSB-C \u5145\u7535\u3001\u7b80\u6d01\u8868\u9762\uff0c\u4ee5\u53ca\u9002\u5408\u96f6\u552e\u9648\u5217\u7684\u9ad8\u8d28\u611f\u8272\u5f69\u3002" },
    news: { eyebrow: "\u8d44\u8baf\u4e2d\u5fc3", title: "\u4ea7\u54c1\u6545\u4e8b\u4e0e\u5e02\u573a\u52a8\u6001\u3002", subtitle: "\u6765\u81ea SZA POWER \u7684\u8bbe\u8ba1\u3001\u5145\u7535\u4e0e\u5e02\u573a\u8d44\u8baf\u3002" },
    about: { eyebrow: "\u5173\u4e8e SZA POWER", title: "\u8ba9\u79fb\u52a8\u7535\u6e90\u6210\u4e3a\u65e5\u5e38\u914d\u4ef6\u3002", subtitle: "SZA POWER \u8bbe\u8ba1\u9002\u5408\u65e5\u5e38\u5145\u7535\u3001\u96f6\u552e\u9648\u5217\u548c\u56fd\u9645\u5206\u9500\u7684\u7cbe\u81f4\u79fb\u52a8\u7535\u6e90\u3002" },
    support: { eyebrow: "\u652f\u6301", title: "\u9762\u5411\u4ea7\u54c1\u3001\u5408\u4f5c\u4f19\u4f34\u548c\u65e5\u5e38\u4f7f\u7528\u7684\u652f\u6301\u3002", subtitle: "\u4e3a\u5145\u7535\u3001\u4ea7\u54c1\u4fdd\u517b\u548c\u5546\u4e1a\u5408\u4f5c\u63d0\u4f9b\u6e05\u6670\u5e2e\u52a9\u3002" },
    contact: { eyebrow: "\u8054\u7cfb", title: "\u544a\u8bc9\u6211\u4eec\u4f60\u7684\u5408\u4f5c\u9700\u6c42\u3002", subtitle: "\u4ea7\u54c1\u3001\u6279\u53d1\u3001OEM \u548c\u552e\u540e\u9700\u6c42\u5747\u53ef\u76f4\u63a5\u63d0\u4ea4\u3002" },
    privacy: { eyebrow: "隐私政策", title: "您的信息只用于明确的用途。", subtitle: "本政策说明 SZA POWER 通过本网站收集哪些信息，以及如何使用这些信息。" },
    terms: { eyebrow: "使用条款", title: "清晰的网站使用约定。", subtitle: "访问或使用本网站，即表示您同意以下基本条款。" }
  }
};
const defaultSections: Record<Locale, Partial<Record<keyof SiteContent, SiteContentSection[]>>> = {
  en: {
    home: [
      { id:"hero-color", eyebrow:"Color Series", title:"A finish for every carry.", subtitle:"Soft metallic colors, slim edges, and dependable mobile charging.", primaryLabel:"Learn more", primaryHref:"/products/pastel-stack", secondaryLabel:"Buy", secondaryHref:"/contact" },
      { id:"hero-orange", eyebrow:"Orange Edition", title:"Power that travels light.", subtitle:"A compact body with USB-C charging and clear power indicators.", primaryLabel:"Learn more", primaryHref:"/products/orange-edition", secondaryLabel:"Contact sales", secondaryHref:"/contact" },
      { id:"promo-blue", title:"Blue Titanium", subtitle:"Cool metallic power for everyday carry." },
      { id:"promo-pastel", title:"Pastel Stack", subtitle:"Soft colors made to look clean from every angle." },
      { id:"promo-orange", title:"Orange", subtitle:"Bright, confident, and easy to find in a bag or workspace." },
      { id:"promo-rose", title:"Rose", subtitle:"A polished pink surface with a soft reflective glow." },
      { id:"promo-usb", title:"USB-C Ready", subtitle:"Designed for daily top-ups, travel, and shared desk power." },
      { id:"promo-multi", title:"Multi Color", subtitle:"A complete color family for retail display and gifting." }
    ],
    about: [
      { id:"company", title:"Company introduction", subtitle:"SZA POWER designs compact mobile power products for everyday carry, retail display, and international distribution." },
      { id:"philosophy", title:"Product philosophy", subtitle:"Products are built around color, finish, clear functions, and comfortable daily use." },
      { id:"cooperation", title:"International cooperation", subtitle:"We support distributors, retailers, wholesale partners, and OEM / ODM projects." }
    ],
    support: [
      { id:"charging", title:"Charging basics", subtitle:"Use certified USB-C cables and adapters suitable for compact mobile power products." },
      { id:"battery", title:"Battery care", subtitle:"Store the product in a cool, dry place and keep it charged for long-term storage." },
      { id:"warranty", title:"Warranty support", subtitle:"Submit purchase, market, and product details through the contact form for assistance." },
      { id:"distribution", title:"Distribution help", subtitle:"Retail and wholesale partners can request packaging, display, and logistics details." }
    ],
    products: [
      { id:"catalog", eyebrow:"All products", title:"Choose the compact power bank that fits your rhythm.", subtitle:"Browse every published model, or narrow the list to featured products." },
      { id:"guides", eyebrow:"Shopping guides", title:"Not sure where to start? Begin with how you carry and how you charge.", subtitle:"Compare everyday carry and retail-ready options." },
      { id:"daily", title:"Everyday carry", subtitle:"Slim, tactile, and ready to top up your phone anywhere.", primaryLabel:"All products", primaryHref:"/products" },
      { id:"retail", title:"Retail-ready", subtitle:"A consistent color system for stores, gifting, and distribution.", primaryLabel:"Contact sales", primaryHref:"/contact" },
      { id:"help", title:"Need help choosing?", subtitle:"Our team can help with product selection, wholesale, and OEM projects.", primaryLabel:"Contact sales", primaryHref:"/contact" }
    ],
    privacy: [
      { id:"information", title:"Information we collect", subtitle:"When you submit an inquiry, we collect the contact and project information you provide. Essential cookies maintain secure admin sessions, while preference cookies remember language choices." },
      { id:"usage", title:"How we use it", subtitle:"Inquiry details are used to reply to product, wholesale, OEM, and support requests. We do not sell personal information." },
      { id:"storage", title:"Storage and contact", subtitle:"Records are retained only as needed for business follow-up and legal obligations. Contact us if you want to access or remove an inquiry." }
    ],
    terms: [
      { id:"website", title:"Website content", subtitle:"Product images, descriptions, and specifications are for presentation and may change by market or project. Final commercial terms are confirmed in writing." },
      { id:"acceptable", title:"Acceptable use", subtitle:"Do not misuse the website, attempt unauthorized access, or submit unlawful or harmful content." },
      { id:"liability", title:"Liability and updates", subtitle:"The website is provided as available. SZA POWER may update these terms and website content as products and services evolve." }
    ]
  },
  cn: {
    home: [
      { id:"hero-color", eyebrow:"彩色系列", title:"每一款配色，都是随身风格。", subtitle:"柔和金属色泽、轻薄边缘、可靠移动充电。", primaryLabel:"进一步了解", primaryHref:"/products/pastel-stack", secondaryLabel:"购买咨询", secondaryHref:"/contact" },
      { id:"hero-orange", eyebrow:"橙色特别款", title:"轻盈出行，随身电力。", subtitle:"紧凑机身、USB-C 充电、清晰电量显示。", primaryLabel:"进一步了解", primaryHref:"/products/orange-edition", secondaryLabel:"联系销售", secondaryHref:"/contact" },
      { id:"promo-blue", title:"蓝钛金属款", subtitle:"冷冽金属质感，精巧口袋尺寸。" },
      { id:"promo-pastel", title:"马卡龙配色", subtitle:"柔和配色，从各个角度都干净利落。" },
      { id:"promo-orange", title:"橙色", subtitle:"明亮醒目，在包裹或工作台上轻松找到。" },
      { id:"promo-rose", title:"玫瑰粉", subtitle:"抛光粉色表面，柔和反光质感。" },
      { id:"promo-usb", title:"USB-C 直连", subtitle:"专为日常补电、旅行和共享桌面电源设计。" },
      { id:"promo-multi", title:"多彩系列", subtitle:"完整配色体系，适合零售展示和企业礼品。" }
    ],
    about: [
      { id:"company", title:"公司介绍", subtitle:"SZA POWER 专注于适合日常携带、零售陈列和国际分销的精致移动电源产品。" },
      { id:"philosophy", title:"产品理念", subtitle:"产品围绕色彩、表面质感、清晰功能和舒适的日常使用体验打造。" },
      { id:"cooperation", title:"国际合作", subtitle:"面向分销商、零售商、批发合作伙伴以及 OEM / ODM 项目提供合作支持。" }
    ],
    support: [
      { id:"charging", title:"充电基础", subtitle:"请使用通过认证的 USB-C 数据线和适配器为移动电源充电。" },
      { id:"battery", title:"电池保养", subtitle:"请将产品存放于阴凉干燥处，长期存放时保持一定电量。" },
      { id:"warranty", title:"保修支持", subtitle:"请通过联系表单提交购买渠道、市场和产品信息以获得帮助。" },
      { id:"distribution", title:"分销支持", subtitle:"零售和批发合作伙伴可索取包装、陈列和物流详情。" }
    ],
    products: [
      { id:"catalog", eyebrow:"所有产品", title:"挑选适合你生活节奏的移动电源。", subtitle:"浏览全部已发布产品，也可只查看精选系列。" },
      { id:"guides", eyebrow:"选购指南", title:"不知道从哪一款开始？先从使用场景和颜色偏好出发。", subtitle:"对比日常随身和零售陈列两种使用方向。" },
      { id:"daily", title:"日常随身", subtitle:"轻薄、好握，放进通勤包即可随时补电。", primaryLabel:"全部产品", primaryHref:"/products" },
      { id:"retail", title:"零售陈列", subtitle:"统一色彩和展示语言，适合门店与礼赠场景。", primaryLabel:"联系销售", primaryHref:"/contact" },
      { id:"help", title:"需要帮助？", subtitle:"我们的团队可以为产品选择、批发和 OEM 项目提供建议。", primaryLabel:"联系销售", primaryHref:"/contact" }
    ],
    privacy: [
      { id:"information", title:"我们收集的信息", subtitle:"当您提交询盘时，我们会收集您主动填写的联系方式与项目信息。必要 Cookie 用于维持后台安全登录，偏好 Cookie 用于记住语言选择。" },
      { id:"usage", title:"信息用途", subtitle:"询盘信息仅用于回复产品、批发、OEM 与售后需求。我们不会出售个人信息。" },
      { id:"storage", title:"保存与联系", subtitle:"记录仅在业务跟进和法律要求所需期限内保存。如需查询或删除询盘，请通过网站联系我们。" }
    ],
    terms: [
      { id:"website", title:"网站内容", subtitle:"产品图片、描述与参数用于展示，可能因市场或项目而调整。最终商务条件以书面报价或协议为准。" },
      { id:"acceptable", title:"合理使用", subtitle:"请勿滥用网站、尝试未经授权的访问，或提交违法、有害内容。" },
      { id:"liability", title:"责任与更新", subtitle:"网站按现状提供。SZA POWER 可根据产品与服务发展更新本条款及网站内容。" }
    ]
  }
};

const domesticSocialLinks: NonNullable<FooterContent["socialLinks"]> = [
  { platform: "douyin", label: "\u6296\u97f3", href: "https://www.douyin.com/" },
  { platform: "kuaishou", label: "\u5feb\u624b", href: "https://www.kuaishou.com/" },
  { platform: "bilibili", label: "\u54d4\u54e9\u54d4\u54e9", href: "https://www.bilibili.com/" },
  { platform: "weibo", label: "\u5fae\u535a", href: "https://weibo.com/" }
];

const internationalSocialLinks: NonNullable<FooterContent["socialLinks"]> = [
  { platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/" },
  { platform: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
  { platform: "x", label: "X", href: "https://x.com/" },
  { platform: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { platform: "facebook", label: "Facebook", href: "https://www.facebook.com/" }
];

const defaultFooter: Record<Locale, FooterContent> = {
  en: {
    disclaimer: "SZA POWER products and services are configured according to market, project, and local electrical requirements. Product images are for presentation only.",
    copyright: "Copyright 2026 SZA POWER. All rights reserved.",
    socialLinks: internationalSocialLinks,
    icpNumber: "",
    legalLinks: [{ label: "Privacy", href: "/support" }, { label: "Terms", href: "/support" }, { label: "Contact", href: "/contact" }],
    columns: [
      { title: "Shop and learn", links: [{ label: "Products", href: "/products" }, { label: "USB-C Power", href: "/products/orange-edition" }, { label: "Color Series", href: "/products/pastel-stack" }, { label: "Support", href: "/support" }] },
      { title: "Services", links: [{ label: "Wholesale", href: "/contact" }, { label: "OEM Projects", href: "/contact" }, { label: "Retail Display", href: "/products" }, { label: "Product Care", href: "/support" }] },
      { title: "For business", links: [{ label: "Distributors", href: "/contact" }, { label: "Retailers", href: "/contact" }, { label: "Corporate Gifts", href: "/contact" }, { label: "Admin", href: "/admin" }] },
      { title: "About SZA", links: [{ label: "Company", href: "/about" }, { label: "News", href: "/news" }, { label: "Contact", href: "/contact" }, { label: "Site map", href: "/" }] }
    ]
  },
  cn: {
    disclaimer: "SZA POWER 产品与服务会根据市场、项目类型及当地电气标准配置。产品图片仅用于展示。",
    copyright: "Copyright 2026 SZA POWER。保留所有权利。",
    socialLinks: domesticSocialLinks,
    icpNumber: "",
    legalLinks: [{ label: "隐私政策", href: "/support" }, { label: "使用条款", href: "/support" }, { label: "联系我们", href: "/contact" }],
    columns: [
      { title: "选购与了解", links: [{ label: "产品", href: "/products" }, { label: "USB-C 电源", href: "/products/orange-edition" }, { label: "彩色系列", href: "/products/pastel-stack" }, { label: "支持", href: "/support" }] },
      { title: "服务", links: [{ label: "批发", href: "/contact" }, { label: "OEM 项目", href: "/contact" }, { label: "零售陈列", href: "/products" }, { label: "产品保养", href: "/support" }] },
      { title: "商业合作", links: [{ label: "分销商", href: "/contact" }, { label: "零售商", href: "/contact" }, { label: "企业礼品", href: "/contact" }, { label: "后台管理", href: "/admin" }] },
      { title: "关于 SZA", links: [{ label: "公司介绍", href: "/about" }, { label: "资讯", href: "/news" }, { label: "联系", href: "/contact" }, { label: "网站地图", href: "/" }] }
    ]
  }
};
const productSeed = [
  ["blue-titanium", "Blue Titanium", "蓝钛色", "Cool metallic power for everyday carry.", "冷冽金属质感，适合每日随身携带。", "A slim compact power bank with a polished blue finish, rounded edges, USB-C charging, and indicator lights for quick battery checks.", "精致超薄移动电源，采用抛光蓝色表面和圆润边缘设计，支持 USB-C 充电，配有电量指示灯。", "Blue / Graphite / Orange", "蓝色 / 石墨色 / 橙色", "/products/web/power-stack-blue.webp", 1, 10],
  ["pastel-stack", "Pastel Stack", "马卡龙配色", "Soft colors with a clean retail-ready presentation.", "柔和配色，适合零售陈列。", "A color family designed for gifting and lifestyle retail. Satin surfaces keep the product calm, refined, and easy to pair.", "专为礼品和生活方式零售设计的配色系列。缎面表面让产品优雅精致。", "Rose / Lime / Teal", "玫瑰色 / 青柠绿 / 湖蓝色", "/products/web/power-stack-pink-vertical.webp", 1, 20],
  ["orange-edition", "Orange Edition", "橙色特别款", "Bright, confident, and easy to find.", "明亮醒目，轻松找到。", "A stronger visual identity while keeping the portable body, USB-C port, side button, and clear power indicators.", "保留便携机身、USB-C 接口、侧边按键和清晰电量指示，同时带来更强的视觉识别。", "Orange", "橙色", "/products/web/power-bank-orange.webp", 1, 30],
  ["rose-edition", "Rose Edition", "玫瑰粉款", "A warm reflective finish for daily carry.", "温暖反光表面，适合每日随身携带。", "The rose finish has a soft metallic reflection and compact profile for travel, desk use, and daily charging.", "玫瑰金表面呈现柔和金属光泽，紧凑外形适合旅行、桌面使用和日常充电。", "Rose", "玫瑰粉", "/products/web/power-stack-pink.webp", 0, 40],
  ["color-series-orange-stack", "Color Series Orange", "彩色系列橙色", "A layered product story in vivid orange.", "生动橙色，层次丰富的产品故事。", "A display-ready hero angle showing the orange body with blue and graphite units underneath.", "彩色系列的陈列展示角度，橙色机身搭配下方的蓝色和石墨色版本。", "Orange / Blue / Graphite", "橙色 / 蓝色 / 石墨色", "/products/web/power-stack-orange.webp", 0, 50]
] as const;
const postSeed = [
  ["color-material-design", "Designing a Compact Power Family Around Color", "围绕色彩设计紧凑电源系列", "How SZA POWER uses finish, reflection, and familiar proportions to make mobile power feel more personal.", "SZA POWER 如何运用表面处理、反光和熟悉比例，让移动电源更具个性。", "The compact power bank category is often treated as purely functional. SZA POWER starts from daily carry instead: color, tactility, reflection, and simple charging behavior.\n\nThe current color family uses polished metallic surfaces and rounded edges to make the product feel closer to a personal accessory than an emergency tool.", "紧凑移动电源通常被视为纯功能产品。SZA POWER 从日常携带出发：色彩、触感、反光和简单的充电行为。\n\n当前配色系列采用抛光金属表面和圆润边缘，让产品更接近个人配件而非应急工具。", "Design", "设计", "/products/web/power-stack-pink.webp", "2026-07-01"],
  ["usb-c-daily-charging", "USB-C and the New Everyday Charging Standard", "USB-C 与新的日常充电标准", "A short guide to simple ports, clear indicators, and travel-ready mobile power.", "简单接口、清晰指示灯和旅行便携移动电源背后的产品决策指南。", "Everyday charging products should be legible in a second. A USB-C port, a side power button, and visible indicator lights are small details that reduce friction.\n\nFor international retail, clarity matters as much as specification. The product should be easy to understand before the package is opened.", "日常充电产品应该一眼就能看懂。USB-C 接口、侧面电源按键和可视指示灯都能减少使用摩擦。\n\n对于国际零售来说，清晰度与规格同样重要。产品应在打开包装前就能轻松理解。", "Product", "产品", "/products/web/power-bank-orange.webp", "2026-07-06"]
] as const;
function now() { return new Date().toISOString(); }
function value(row: Record<string, string | number>, key: string) { return String(row[key] ?? ""); }
function numberValue(row: Record<string, string | number>, key: string) { return Number(row[key] ?? 0); }
function localeOf(value: unknown): Locale { return value === "cn" ? "cn" : "en"; }
function slugify(input: string) { return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `item-${Date.now()}`; }
function looksMojibake(value: string) { return /[Ѐ-ӿÀ-ÿ�]/.test(value); }

function db() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const root = globalThis as typeof globalThis & { __szaPowerDb?: DatabaseSync; __szaPowerDbReady?: boolean };
  if (!root.__szaPowerDb) root.__szaPowerDb = new DatabaseSync(dbPath);
  const database = root.__szaPowerDb;
  if (!root.__szaPowerDbReady) {
    database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    database.exec(`
      CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, name_cn TEXT NOT NULL, subtitle TEXT NOT NULL, subtitle_cn TEXT NOT NULL, description TEXT NOT NULL, description_cn TEXT NOT NULL, color TEXT NOT NULL, color_cn TEXT NOT NULL, capacity TEXT NOT NULL, capacity_cn TEXT NOT NULL, input TEXT NOT NULL, output TEXT NOT NULL, price TEXT NOT NULL, price_cn TEXT NOT NULL, image TEXT NOT NULL, images TEXT NOT NULL DEFAULT '[]', featured INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 100, status TEXT NOT NULL DEFAULT 'published', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, title_cn TEXT NOT NULL, excerpt TEXT NOT NULL, excerpt_cn TEXT NOT NULL, content TEXT NOT NULL, content_cn TEXT NOT NULL, category TEXT NOT NULL, category_cn TEXT NOT NULL, image TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'published', published_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', project_type TEXT NOT NULL DEFAULT '', message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'owner', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS access_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT NOT NULL, path TEXT NOT NULL, method TEXT NOT NULL, user_agent TEXT NOT NULL DEFAULT '', referer TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS security_events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'info', ip TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, email TEXT NOT NULL DEFAULT '', failed_count INTEGER NOT NULL DEFAULT 0, window_started_at TEXT NOT NULL, locked_until TEXT, last_attempt_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS captchas (id TEXT PRIMARY KEY, answer_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, request_count INTEGER NOT NULL DEFAULT 0, window_started_at TEXT NOT NULL, expires_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_products_status_sort ON products(status, sort_order);
      CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at DESC);
    `);
    const productColumns = database.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
    if (!productColumns.some((column) => column.name === "images")) database.exec("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]';");
    const adminColumns = database.prepare("PRAGMA table_info(admins)").all() as Array<{ name: string }>;
    if (!adminColumns.some((column) => column.name === "role")) database.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'owner';");
    seed(database);
    root.__szaPowerDbReady = true;
  }
  database.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  return database;
}

function put(database: DatabaseSync, key: string, data: unknown) {
  database.prepare("INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").run(key, JSON.stringify(data), now());
}
function read<T>(database: DatabaseSync, key: string, fallback: T): T {
  const result = database.prepare("SELECT value FROM site_settings WHERE key = ?").get(key) as { value?: string } | undefined;
  if (!result?.value) return fallback;
  try { return JSON.parse(result.value) as T; } catch { return fallback; }
}
function seed(database: DatabaseSync) {
  const count = database.prepare("SELECT COUNT(*) AS total FROM products").get() as { total: number };
  if (!count.total) {
    const insert = database.prepare("INSERT INTO products (slug,name,name_cn,subtitle,subtitle_cn,description,description_cn,color,color_cn,capacity,capacity_cn,input,output,price,price_cn,image,images,featured,sort_order,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    for (const item of productSeed) insert.run(item[0],item[1],item[2],item[3],item[4],item[5],item[6],item[7],item[8],"Compact mobile power","便携移动电源","USB-C","USB-C","Contact us","联系咨询",item[9],JSON.stringify([item[9]]),item[10],item[11],"published",now(),now());
  }
  const insertMissingProduct = database.prepare("INSERT OR IGNORE INTO products (slug,name,name_cn,subtitle,subtitle_cn,description,description_cn,color,color_cn,capacity,capacity_cn,input,output,price,price_cn,image,images,featured,sort_order,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const item of productSeed) insertMissingProduct.run(item[0],item[1],item[2],item[3],item[4],item[5],item[6],item[7],item[8],"Compact mobile power","便携移动电源","USB-C","USB-C","Contact us","联系咨询",item[9],JSON.stringify([item[9]]),item[10],item[11],"published",now(),now());
  const posts = database.prepare("SELECT COUNT(*) AS total FROM posts").get() as { total: number };
  if (!posts.total) {
    const insert = database.prepare("INSERT INTO posts (slug,title,title_cn,excerpt,excerpt_cn,content,content_cn,category,category_cn,image,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    for (const item of postSeed) insert.run(item[0],item[1],item[2],item[3],item[4],item[5],item[6],item[7],item[8],item[9],"published",item[10],now(),now());
  }
  const insertMissingPost = database.prepare("INSERT OR IGNORE INTO posts (slug,title,title_cn,excerpt,excerpt_cn,content,content_cn,category,category_cn,image,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  for (const item of postSeed) insertMissingPost.run(item[0],item[1],item[2],item[3],item[4],item[5],item[6],item[7],item[8],item[9],"published",item[10],now(),now());
  for (const locale of ["en", "cn"] as const) {
    if (!database.prepare("SELECT 1 FROM site_settings WHERE key = ?").get(`site_content_${locale}`)) put(database, `site_content_${locale}`, defaultSiteContent[locale]);
    if (!database.prepare("SELECT 1 FROM site_settings WHERE key = ?").get(`footer_${locale}`)) put(database, `footer_${locale}`, defaultFooter[locale]);
    const navigation = read(database, `navigation_${locale}`, defaultNavigationByLocale[locale]);
    if (!navigation.items?.length || (locale === "cn" && looksMojibake(JSON.stringify(navigation)))) put(database, `navigation_${locale}`, defaultNavigationByLocale[locale]);
  }
  const adminCount = database.prepare("SELECT COUNT(*) AS total FROM admins").get() as { total: number };
  if (!adminCount.total) {
    const email = process.env.SZA_ADMIN_EMAIL ?? "admin@sza-power.com";
    const configuredPassword = process.env.SZA_ADMIN_PASSWORD;
    if (process.env.NODE_ENV === "production" && !configuredPassword) throw new Error("SZA_ADMIN_PASSWORD is required when creating the first production administrator.");
    const password = configuredPassword ?? "admin123456";
    database.prepare("INSERT INTO admins (email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(email.toLowerCase(), hashPassword(password), "owner", now(), now());
  }
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$16384$8$1$${salt}$${hash}`;
}
function passwordMatches(password: string, stored: string) {
  if (stored.startsWith("scrypt$")) {
    const [, n, r, p, salt, expected] = stored.split("$");
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(password, salt, 32, { N:Number(n), r:Number(r), p:Number(p) }).toString("hex");
    return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  }
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function productImagesValue(row: ProductRow) { const main=value(row,"image"); try { const parsed=JSON.parse(value(row,"images")); if(Array.isArray(parsed)){const clean=parsed.filter((item):item is string=>typeof item==="string"&&item.length>0); return Array.from(new Set([main,...clean].filter(Boolean)));} } catch {} return main?[main]:[]; }
function mapProduct(row: ProductRow): Product {
  return { id:numberValue(row,"id"), slug:value(row,"slug"), name:value(row,"name"), nameCn:value(row,"name_cn"), subtitle:value(row,"subtitle"), subtitleCn:value(row,"subtitle_cn"), description:value(row,"description"), descriptionCn:value(row,"description_cn"), color:value(row,"color"), colorCn:value(row,"color_cn"), capacity:value(row,"capacity"), capacityCn:value(row,"capacity_cn"), input:value(row,"input"), output:value(row,"output"), price:value(row,"price"), priceCn:value(row,"price_cn"), image:value(row,"image"), images:productImagesValue(row), featured:Boolean(numberValue(row,"featured")), sortOrder:numberValue(row,"sort_order"), status:value(row,"status") === "draft" ? "draft" : "published", createdAt:value(row,"created_at"), updatedAt:value(row,"updated_at") };
}
function localizedProduct(product: Product, locale: Locale): LocalizedProduct {
  const chinese = locale === "cn";
  return { ...product, name:chinese ? product.nameCn : product.name, subtitle:chinese ? product.subtitleCn : product.subtitle, description:chinese ? product.descriptionCn : product.description, color:chinese ? product.colorCn : product.color, capacity:chinese ? product.capacityCn : product.capacity, price:chinese ? product.priceCn : product.price };
}
function mapPost(row: PostRow): Post {
  return { id:numberValue(row,"id"), slug:value(row,"slug"), title:value(row,"title"), titleCn:value(row,"title_cn"), excerpt:value(row,"excerpt"), excerptCn:value(row,"excerpt_cn"), content:value(row,"content"), contentCn:value(row,"content_cn"), category:value(row,"category"), categoryCn:value(row,"category_cn"), image:value(row,"image"), status:value(row,"status") === "draft" ? "draft" : "published", publishedAt:value(row,"published_at"), createdAt:value(row,"created_at"), updatedAt:value(row,"updated_at") };
}
function localizedPost(post: Post, locale: Locale): LocalizedPost {
  const chinese = locale === "cn";
  return { ...post, title:chinese ? post.titleCn : post.title, excerpt:chinese ? post.excerptCn : post.excerpt, content:chinese ? post.contentCn : post.content, category:chinese ? post.categoryCn : post.category };
}

export function getAdminProducts() { return (db().prepare("SELECT * FROM products ORDER BY sort_order, id").all() as ProductRow[]).map(mapProduct); }
export function getProducts({ includeDrafts = false, featuredOnly = false, locale = "en" }: { includeDrafts?: boolean; featuredOnly?: boolean; locale?: Locale } = {}) {
  const clauses = [includeDrafts ? "" : "status = 'published'", featuredOnly ? "featured = 1" : ""].filter(Boolean);
  const rows = db().prepare(`SELECT * FROM products ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY sort_order, id`).all() as ProductRow[];
  return rows.map(mapProduct).map((item) => localizedProduct(item, locale));
}
export function getProductBySlug(slug: string, includeDrafts = false, locale: Locale = "en") {
  const row = db().prepare(`SELECT * FROM products WHERE slug = ? ${includeDrafts ? "" : "AND status = 'published'"} LIMIT 1`).get(slug) as ProductRow | undefined;
  return row ? localizedProduct(mapProduct(row), locale) : null;
}
export function saveProduct(input: Partial<Product> & { id?: number }) {
  const database = db(); const stamp = now(); const slug = safeSlug(input.slug, input.name || "product");
  const mainImage = safeMedia(input.image ?? input.images?.[0] ?? productImages[0]);
  const gallery = Array.from(new Set([mainImage, ...(Array.isArray(input.images) ? input.images : [])].map((item) => safeMedia(item)).filter(Boolean))).slice(0, 200);
  const values = [slug, safeText(input.name, 160), safeText(input.nameCn ?? input.name, 160), safeText(input.subtitle, 300), safeText(input.subtitleCn ?? input.subtitle, 300), safeText(input.description, 5000), safeText(input.descriptionCn ?? input.description, 5000), safeText(input.color, 120), safeText(input.colorCn ?? input.color, 120), safeText(input.capacity, 120, "Compact mobile power"), safeText(input.capacityCn ?? input.capacity, 120, "便携移动电源"), safeText(input.input, 80, "USB-C"), safeText(input.output, 80, "USB-C"), safeText(input.price, 120, "Contact us"), safeText(input.priceCn ?? input.price, 120, "联系咨询"), mainImage, JSON.stringify(gallery), input.featured ? 1 : 0, clampInteger(input.sortOrder, 0, 100000, 100), input.status === "draft" ? "draft" : "published"];
  if (input.id) { database.prepare("UPDATE products SET slug=?,name=?,name_cn=?,subtitle=?,subtitle_cn=?,description=?,description_cn=?,color=?,color_cn=?,capacity=?,capacity_cn=?,input=?,output=?,price=?,price_cn=?,image=?,images=?,featured=?,sort_order=?,status=?,updated_at=? WHERE id=?").run(...values, stamp, input.id); return getAdminProducts().find((item) => item.id === input.id) ?? null; }
  const result = database.prepare("INSERT INTO products (slug,name,name_cn,subtitle,subtitle_cn,description,description_cn,color,color_cn,capacity,capacity_cn,input,output,price,price_cn,image,images,featured,sort_order,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(...values, stamp, stamp);
  return getAdminProducts().find((item) => item.id === Number(result.lastInsertRowid)) ?? null;
}
export function deleteProduct(id: number) { db().prepare("DELETE FROM products WHERE id = ?").run(id); }

export function getAdminPosts() { return (db().prepare("SELECT * FROM posts ORDER BY published_at DESC, id DESC").all() as PostRow[]).map(mapPost); }
export function getPosts({ includeDrafts = false, locale = "en" }: { includeDrafts?: boolean; locale?: Locale } = {}) {
  const rows = db().prepare(`SELECT * FROM posts ${includeDrafts ? "" : "WHERE status = 'published'"} ORDER BY published_at DESC, id DESC`).all() as PostRow[];
  return rows.map(mapPost).map((item) => localizedPost(item, locale));
}
export function getPostBySlug(slug: string, includeDrafts = false, locale: Locale = "en") { const row = db().prepare(`SELECT * FROM posts WHERE slug = ? ${includeDrafts ? "" : "AND status = 'published'"} LIMIT 1`).get(slug) as PostRow | undefined; return row ? localizedPost(mapPost(row), locale) : null; }
export function savePost(input: Partial<Post> & { id?: number }) {
  const database = db(); const stamp = now(); const slug = safeSlug(input.slug, input.title || "news");
  const values = [slug, safeText(input.title, 200), safeText(input.titleCn ?? input.title, 200), safeText(input.excerpt, 800), safeText(input.excerptCn ?? input.excerpt, 800), safeText(input.content, 20000), safeText(input.contentCn ?? input.content, 20000), safeText(input.category, 120, "News"), safeText(input.categoryCn ?? input.category, 120, "资讯"), safeMedia(input.image ?? productImages[0]), input.status === "draft" ? "draft" : "published", safeDate(input.publishedAt, stamp.slice(0, 10))];
  if (input.id) { database.prepare("UPDATE posts SET slug=?,title=?,title_cn=?,excerpt=?,excerpt_cn=?,content=?,content_cn=?,category=?,category_cn=?,image=?,status=?,published_at=?,updated_at=? WHERE id=?").run(...values, stamp, input.id); return getAdminPosts().find((item) => item.id === input.id) ?? null; }
  const result = database.prepare("INSERT INTO posts (slug,title,title_cn,excerpt,excerpt_cn,content,content_cn,category,category_cn,image,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(...values, stamp, stamp);
  return getAdminPosts().find((item) => item.id === Number(result.lastInsertRowid)) ?? null;
}
export function deletePost(id: number) { db().prepare("DELETE FROM posts WHERE id = ?").run(id); }

export function getInquiries(): Inquiry[] { return (db().prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all() as InquiryRow[]).map((row) => ({ id:numberValue(row,"id"),name:value(row,"name"),email:value(row,"email"),company:value(row,"company"),country:value(row,"country"),projectType:value(row,"project_type"),message:value(row,"message"),status:(value(row,"status") === "contacted" || value(row,"status") === "closed") ? value(row,"status") as Inquiry["status"] : "new",createdAt:value(row,"created_at") })); }
export function createInquiry(input: Omit<Inquiry,"id" | "status" | "createdAt">) { const database=db(); const result=database.prepare("INSERT INTO inquiries (name,email,company,country,project_type,message,status,created_at) VALUES (?,?,?,?,?,?,?,?)").run(input.name,input.email,input.company,input.country,input.projectType,input.message,"new",now()); return getInquiries().find((item)=>item.id===Number(result.lastInsertRowid)) ?? null; }
export function updateInquiryStatus(id: number, status: Inquiry["status"]) { db().prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status,id); return getInquiries().find((item) => item.id === id) ?? null; }
export function getDashboardStats(): DashboardStats { const database=db(); const one=(query:string)=>Number((database.prepare(query).get() as { count:number }).count); return { products:one("SELECT COUNT(*) AS count FROM products"),posts:one("SELECT COUNT(*) AS count FROM posts"),newInquiries:one("SELECT COUNT(*) AS count FROM inquiries WHERE status='new'"),publishedProducts:one("SELECT COUNT(*) AS count FROM products WHERE status='published'") }; }

export function getAdminRole(email: string): AdminRole {
  const row=db().prepare("SELECT role FROM admins WHERE email = ? LIMIT 1").get(email.trim().toLowerCase()) as {role?:string} | undefined;
  return row?.role === "editor" || row?.role === "support" ? row.role : "owner";
}
export function getAdminUsers(){
  const rows=db().prepare("SELECT id,email,role,created_at,updated_at FROM admins ORDER BY id").all() as Array<Record<string,string|number>>;
  return rows.map((row)=>({id:numberValue(row,"id"),email:value(row,"email"),role:(value(row,"role")==="editor"||value(row,"role")==="support"?value(row,"role"):"owner") as AdminRole,createdAt:value(row,"created_at"),updatedAt:value(row,"updated_at")}));
}
export function updateAdminRole(id:number, role:AdminRole){
  if (!["owner", "editor", "support"].includes(role)) throw new Error("Invalid administrator role.");
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid administrator id.");
  const database = db();
  const current = database.prepare("SELECT role FROM admins WHERE id = ? LIMIT 1").get(id) as { role?: string } | undefined;
  if (!current) throw new Error("Administrator not found.");
  if (current.role === "owner" && role !== "owner") {
    const owners = Number((database.prepare("SELECT COUNT(*) AS count FROM admins WHERE role = 'owner'").get() as { count:number }).count);
    if (owners <= 1) throw new Error("At least one owner administrator must remain.");
  }
  database.prepare("UPDATE admins SET role = ?, updated_at = ? WHERE id = ?").run(role, now(), id);
  return getAdminUsers().find((item)=>item.id===id) ?? null;
}
export function updateAdminEmail(id:number, email:string){
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid administrator id.");
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Invalid email address.");
  const database = db();
  const exists = database.prepare("SELECT 1 FROM admins WHERE email = ? AND id != ? LIMIT 1").get(normalized, id);
  if (exists) throw new Error("Email address is already in use.");
  database.prepare("UPDATE admins SET email = ?, updated_at = ? WHERE id = ?").run(normalized, now(), id);
  return getAdminUsers().find((item)=>item.id===id) ?? null;
}
export function updateAdminPassword(id:number, password:string){
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid administrator id.");
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");
  const database = db();
  const exists = database.prepare("SELECT 1 FROM admins WHERE id = ? LIMIT 1").get(id);
  if (!exists) throw new Error("Administrator not found.");
  database.prepare("UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?").run(hashPassword(password), now(), id);
  return getAdminUsers().find((item)=>item.id===id) ?? null;
}
function clipped(value: unknown, max: number) { return String(value ?? "").trim().slice(0, max); }
function safeText(value: unknown, max: number, fallback = "") { const text = clipped(value, max); return text || fallback; }
function safeHref(value: unknown, fallback = "/") {
  const href = clipped(value, 1000);
  if (!href) return fallback;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^(?:https?:\/\/|mailto:[^\s]+$|tel:[0-9+()\-\s]+$)/i.test(href)) return href;
  // Allow the common shorthand form (www.example.com) while keeping unsafe schemes out.
  if (/^www\.[^\s]+$/i.test(href)) return `https://${href}`;
  if (/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(href)) return `https://${href}`;
  return fallback;
}function cleanMedia(value: unknown): PageMedia | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input=value as Partial<PageMedia>; const src=safeMedia(input.src); if (!src) return undefined;
  return { type: input.type === "video" ? "video" : "image", src, poster: input.poster ? safeMedia(input.poster) : undefined, alt: safeText(input.alt, 240) || undefined };
}
function cleanPage(value: unknown): SiteContent["home"] {
  const input=(value ?? {}) as Partial<SiteContent["home"]>;
  return {
    eyebrow:safeText(input.eyebrow,200), title:safeText(input.title,300), subtitle:safeText(input.subtitle,2000), media:cleanMedia(input.media),
    primaryLabel:input.primaryLabel ? safeText(input.primaryLabel,160) : undefined, primaryHref:input.primaryHref ? safeHref(input.primaryHref) : undefined,
    secondaryLabel:input.secondaryLabel ? safeText(input.secondaryLabel,160) : undefined, secondaryHref:input.secondaryHref ? safeHref(input.secondaryHref) : undefined,
    sections:Array.isArray(input.sections) ? input.sections.slice(0,100).map((section,index)=>({id:safeText(section.id,80,`section-${index+1}`),eyebrow:section.eyebrow ? safeText(section.eyebrow,160) : undefined,title:safeText(section.title,300),subtitle:safeText(section.subtitle,2000),primaryLabel:section.primaryLabel ? safeText(section.primaryLabel,160) : undefined,primaryHref:section.primaryHref ? safeHref(section.primaryHref) : undefined,secondaryLabel:section.secondaryLabel ? safeText(section.secondaryLabel,160) : undefined,secondaryHref:section.secondaryHref ? safeHref(section.secondaryHref) : undefined,media:cleanMedia(section.media)})) : undefined
  };
}
function safeSlug(value: unknown, fallback: unknown) {
  const raw = clipped(value, 120).toLowerCase();
  const slug = raw || slugify(clipped(fallback, 120) || "item");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and hyphens only.");
  return slug;
}
function safeMedia(value: unknown, max = 2000) {
  const source = clipped(value, max);
  if (!source) return "";
  if (!source.startsWith("/") && !/^https:\/\//i.test(source)) throw new Error("Media URL must be a site path or HTTPS URL.");
  return source;
}
function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value); return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : fallback;
}
function safeDate(value: unknown, fallback: string) {
  const date = clipped(value, 30); return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : fallback;
}
function sha256(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }

export function recordAccessLog(input: { ip: string; path: string; method?: string; userAgent?: string; referer?: string }) {
  const database = db();
  database.prepare("INSERT INTO access_logs (ip,path,method,user_agent,referer,created_at) VALUES (?,?,?,?,?,?)").run(clipped(input.ip,64),clipped(input.path,500),clipped(input.method ?? "GET",12),clipped(input.userAgent,1000),clipped(input.referer,500),now());
  const count = database.prepare("SELECT COUNT(*) AS count FROM access_logs").get() as { count:number };
  if (count.count > 20000) database.prepare("DELETE FROM access_logs WHERE id IN (SELECT id FROM access_logs ORDER BY id ASC LIMIT ?)").run(count.count - 20000);
}
export function getAccessLogs(limit = 100): AccessLog[] {
  const rows = db().prepare("SELECT * FROM access_logs ORDER BY created_at DESC, id DESC LIMIT ?").all(Math.max(1,Math.min(500,Math.floor(limit)))) as Array<Record<string,string | number>>;
  return rows.map((row)=>({id:numberValue(row,"id"),ip:value(row,"ip"),path:value(row,"path"),method:value(row,"method"),userAgent:value(row,"user_agent"),referer:value(row,"referer"),createdAt:value(row,"created_at")}));
}
export function recordSecurityEvent(input: { type:string; severity?:SecurityEvent["severity"]; ip?:string; actor?:string; detail?:string }) {
  db().prepare("INSERT INTO security_events (type,severity,ip,actor,detail,created_at) VALUES (?,?,?,?,?,?)").run(clipped(input.type,80),input.severity ?? "info",clipped(input.ip,64),clipped(input.actor,200),clipped(input.detail,1000),now());
}
export function getSecurityEvents(limit = 100): SecurityEvent[] {
  const rows = db().prepare("SELECT * FROM security_events ORDER BY created_at DESC, id DESC LIMIT ?").all(Math.max(1,Math.min(500,Math.floor(limit)))) as Array<Record<string,string | number>>;
  return rows.map((row)=>({id:numberValue(row,"id"),type:value(row,"type"),severity:(value(row,"severity")==="critical"||value(row,"severity")==="warning"?value(row,"severity"):"info") as SecurityEvent["severity"],ip:value(row,"ip"),actor:value(row,"actor"),detail:value(row,"detail"),createdAt:value(row,"created_at")}));
}

export function createCaptchaRecord(answer: string, ttlMinutes = 5) {
  const database = db();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now()+Math.max(1,Math.min(15,ttlMinutes))*60_000).toISOString();
  database.prepare("DELETE FROM captchas WHERE expires_at <= ? OR used_at IS NOT NULL").run(now());
  database.prepare("INSERT INTO captchas (id,answer_hash,expires_at,created_at) VALUES (?,?,?,?)").run(id,sha256(id+":"+answer.toUpperCase()),expiresAt,now());
  return id;
}
export function consumeCaptcha(id: string, answer: string) {
  const database = db();
  const row = database.prepare("SELECT answer_hash,expires_at,used_at FROM captchas WHERE id = ? LIMIT 1").get(clipped(id,80)) as { answer_hash?:string; expires_at?:string; used_at?:string | null } | undefined;
  if (!row?.answer_hash || row.used_at || !row.expires_at || row.expires_at <= now()) return false;
  database.prepare("UPDATE captchas SET used_at = ? WHERE id = ?").run(now(),clipped(id,80));
  const actual = sha256(clipped(id,80)+":"+clipped(answer,12).toUpperCase());
  return actual.length===row.answer_hash.length && crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(row.answer_hash));
}

export function getLoginIpLock(ip: string) {
  const database = db();
  const key = clipped(ip || "unknown",64);
  const row = database.prepare("SELECT failed_count,locked_until FROM login_attempts WHERE ip = ? LIMIT 1").get(key) as { failed_count?:number; locked_until?:string | null } | undefined;
  if (!row?.locked_until || row.locked_until <= now()) return { locked:false, lockedUntil:"", failedCount:Number(row?.failed_count ?? 0) };
  return { locked:true, lockedUntil:row.locked_until, failedCount:Number(row.failed_count ?? 0) };
}
export function recordLoginFailure(ip: string, email: string, threshold = 5, lockMinutes = 30) {
  const database = db();
  const key = clipped(ip || "unknown",64);
  const stamp = now();
  const row = database.prepare("SELECT failed_count,window_started_at FROM login_attempts WHERE ip = ? LIMIT 1").get(key) as { failed_count?:number; window_started_at?:string } | undefined;
  const withinWindow = Boolean(row?.window_started_at && Date.parse(row.window_started_at) > Date.now()-15*60_000);
  const failedCount = withinWindow ? Number(row?.failed_count ?? 0)+1 : 1;
  const lockedUntil = failedCount >= Math.max(3,threshold) ? new Date(Date.now()+Math.max(5,Math.min(1440,lockMinutes))*60_000).toISOString() : null;
  const windowStarted = withinWindow && row?.window_started_at ? row.window_started_at : stamp;
  database.prepare("INSERT INTO login_attempts (ip,email,failed_count,window_started_at,locked_until,last_attempt_at) VALUES (?,?,?,?,?,?) ON CONFLICT(ip) DO UPDATE SET email=excluded.email,failed_count=excluded.failed_count,window_started_at=excluded.window_started_at,locked_until=excluded.locked_until,last_attempt_at=excluded.last_attempt_at").run(key,clipped(email,254),failedCount,windowStarted,lockedUntil,stamp);
  return { failedCount, locked:Boolean(lockedUntil), lockedUntil:lockedUntil ?? "" };
}
export function clearLoginFailures(ip: string) { db().prepare("DELETE FROM login_attempts WHERE ip = ?").run(clipped(ip || "unknown",64)); }

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const database = db();
  const safeKey = clipped(key,200);
  const stamp = now();
  const row = database.prepare("SELECT request_count,expires_at FROM rate_limits WHERE key = ? LIMIT 1").get(safeKey) as { request_count?:number; expires_at?:string } | undefined;
  const active = Boolean(row?.expires_at && row.expires_at > stamp);
  const count = active ? Number(row?.request_count ?? 0)+1 : 1;
  const expiresAt = active && row?.expires_at ? row.expires_at : new Date(Date.now()+Math.max(1000,windowMs)).toISOString();
  database.prepare("INSERT INTO rate_limits (key,request_count,window_started_at,expires_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET request_count=excluded.request_count,window_started_at=excluded.window_started_at,expires_at=excluded.expires_at").run(safeKey,count,active?new Date(Date.parse(expiresAt)-windowMs).toISOString():stamp,expiresAt);
  if (Math.random()<0.01) database.prepare("DELETE FROM rate_limits WHERE expires_at <= ?").run(stamp);
  return { allowed:count<=Math.max(1,limit), remaining:Math.max(0,limit-count), retryAfterSeconds:Math.max(1,Math.ceil((Date.parse(expiresAt)-Date.now())/1000)) };
}
export function getNavigationConfig(locale?: unknown) { const selected=localeOf(locale); const value=read(db(),`navigation_${selected}`,defaultNavigationByLocale[selected]); return selected === "cn" && looksMojibake(JSON.stringify(value)) ? defaultNavigationByLocale.cn : value; }
export function saveNavigationConfig(value: unknown, locale: Locale = "en") { const navigation=value as NavigationConfig; if (!navigation || !Array.isArray(navigation.items)) throw new Error("Navigation must include menu items."); const clean:NavigationConfig={brand:safeText(navigation.brand,120,"SZA"),items:navigation.items.slice(0,20).map((item,index)=>({id:safeText(item.id,80,`item-${index+1}`),label:safeText(item.label,120,"Untitled"),href:safeHref(item.href),columns:Array.isArray(item.columns)?item.columns.slice(0,8).map((column)=>({eyebrow:safeText(column.eyebrow,120),links:Array.isArray(column.links)?column.links.slice(0,40).map((link)=>({label:safeText(link.label,160,"Untitled"),href:safeHref(link.href),featured:Boolean(link.featured)})):[]})):[]}))}; put(db(),`navigation_${locale}`,clean); return clean; }
export function getSiteContent(locale: Locale = "en") { const stored=read(db(),`site_content_${locale}`,defaultSiteContent[locale]); const defaults=defaultSiteContent[locale]; return Object.fromEntries((Object.keys(defaults) as Array<keyof SiteContent>).map((key)=>[key,{...defaults[key],...(stored[key] ?? {}),sections:stored[key]?.sections ?? defaultSections[locale][key] ?? defaults[key].sections}])) as SiteContent; }
export function saveSiteContent(locale: Locale, content: SiteContent) { const current=getSiteContent(locale); const input=content as Partial<SiteContent>; const clean=Object.fromEntries((Object.keys(current) as Array<keyof SiteContent>).map((key)=>[key,cleanPage({...current[key],...(input[key] ?? {})})])) as SiteContent; put(db(),`site_content_${locale}`,clean); return getSiteContent(locale); }
export function getFooterContent(locale: Locale = "en") {
  const stored=read(db(),`footer_${locale}`,defaultFooter[locale]);
  const value=locale === "cn" && looksMojibake(JSON.stringify(stored)) ? defaultFooter.cn : stored;
  const fallbackSocialLinks=locale === "cn" ? domesticSocialLinks : internationalSocialLinks;
  return {...value,socialLinks:Array.isArray(value.socialLinks)?value.socialLinks:fallbackSocialLinks,icpNumber:String(value.icpNumber??"")} as FooterContent;
}
export function saveFooterContent(locale: Locale, content: FooterContent) {
  const input=content as Partial<FooterContent>;
  const fallbackSocialLinks=locale === "cn" ? domesticSocialLinks : internationalSocialLinks;
  const socialLinks=(Array.isArray(input.socialLinks)?input.socialLinks:fallbackSocialLinks).slice(0,16).map((item)=>({
    platform:safeText(item.platform,24,"douyin") as NonNullable<FooterContent["socialLinks"]>[number]["platform"],
    label:safeText(item.label,80,"Social"),
    href:safeHref(item.href,"")
  }));
  const clean:FooterContent={
    disclaimer:safeText(input.disclaimer,2000),
    copyright:safeText(input.copyright,300),
    legalLinks:(Array.isArray(input.legalLinks)?input.legalLinks:[]).slice(0,20).map((item)=>({label:safeText(item.label,160,"Link"),href:safeHref(item.href)})),
    columns:(Array.isArray(input.columns)?input.columns:[]).slice(0,12).map((column)=>({title:safeText(column.title,160,"Links"),links:(Array.isArray(column.links)?column.links:[]).slice(0,40).map((item)=>({label:safeText(item.label,160,"Link"),href:safeHref(item.href)}))})),
    socialLinks,
    icpNumber:safeText(input.icpNumber,120)
  };
  put(db(),`footer_${locale}`,clean);
  return getFooterContent(locale);
}
const defaultSystemSettings: Record<string, unknown> = {
  siteName: "SZA POWER",
  headerName: "SZA",
  siteLogo: "",
  siteLogoAlt: "SZA POWER",
  showSiteName: true,
  contactEmail: "sales@sza-power.com",
  contactLocation: "International mobile power brand",
  contactDescription: "Product, wholesale, OEM, and support requests",
  contactPhone: "",
  contactWidgetEnabled: true,
  contactWidgetTitleCn: "联系我们",
  contactWidgetTitleEn: "Contact us",
  contactWidgetSubtitleCn: "我们很乐意为您提供帮助",
  contactWidgetSubtitleEn: "We are happy to help",
  contactWidgetButtonCn: "联系我们",
  contactWidgetButtonEn: "Contact us",
  contactQrCode: "",
  contactQrLabelCn: "扫码联系我们",
  contactQrLabelEn: "Scan to contact us",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpFrom: "",
  notificationEmail: "",
  passwordResetHours: 2,
  loginMaxAttempts: 5,
  loginLockMinutes: 30,
  automaticBackupEnabled: true,
  automaticBackupHours: 24,
  accessLogRetentionDays: 90
};
export function getSystemSettings() { return { ...defaultSystemSettings, ...read(db(),"system_settings",defaultSystemSettings) }; }
const allowedSystemSettings = new Set(Object.keys(defaultSystemSettings));
export function saveSystemSettings(settings: Record<string, unknown>) {
  const clean:Record<string,unknown>={};
  for(const [key,input] of Object.entries(settings ?? {})) if(allowedSystemSettings.has(key)) clean[key]=input;
  put(db(),"system_settings",{ ...getSystemSettings(), ...clean });
  return getSystemSettings();
}
export function getDatabasePath() { db(); return dbPath; }
export function checkpointDatabase() { db().exec("PRAGMA wal_checkpoint(FULL);"); return dbPath; }
export function verifyAdmin(email: string, password: string) {
  const normalized=email.trim().toLowerCase();
  const database=db();
  const record=database.prepare("SELECT password_hash FROM admins WHERE email = ? LIMIT 1").get(normalized) as { password_hash?: string } | undefined;
  if(!record?.password_hash || !passwordMatches(password,record.password_hash)) return false;
  if(!record.password_hash.startsWith("scrypt$")) database.prepare("UPDATE admins SET password_hash = ?, updated_at = ? WHERE email = ?").run(hashPassword(password),now(),normalized);
  return true;
}
export function adminExists(email: string) { return Boolean(db().prepare("SELECT 1 FROM admins WHERE email = ? LIMIT 1").get(email.trim().toLowerCase())); }
export function createPasswordReset(email: string, hours = 2) { const raw=crypto.randomBytes(32).toString("base64url"); const hash=crypto.createHash("sha256").update(raw).digest("hex"); const expires=new Date(Date.now()+Math.max(1,Math.min(hours,24))*3600_000).toISOString(); const database=db(); database.prepare("UPDATE password_resets SET used_at = ? WHERE email = ? AND used_at IS NULL").run(now(),email.toLowerCase()); database.prepare("INSERT INTO password_resets (email,token_hash,expires_at,created_at) VALUES (?,?,?,?)").run(email.toLowerCase(),hash,expires,now()); return raw; }
export function resetAdminPassword(token: string, password: string) { if(password.length<10)return false; const hash=crypto.createHash("sha256").update(token).digest("hex"); const database=db(); const reset=database.prepare("SELECT id,email FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? LIMIT 1").get(hash,now()) as { id:number; email:string } | undefined; if(!reset)return false; database.prepare("UPDATE admins SET password_hash = ?, updated_at = ? WHERE email = ?").run(hashPassword(password),now(),reset.email); database.prepare("UPDATE password_resets SET used_at = ? WHERE id = ?").run(now(),reset.id); return true; }
