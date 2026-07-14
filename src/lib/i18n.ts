import type { Locale } from "@/lib/navigation";

export { type Locale } from "@/lib/navigation";

export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  return pathname?.startsWith("/cn") ? "cn" : "en";
}

export function withLocale(href: string, locale: Locale): string {
  if (!href.startsWith("/")) return href;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
  if (href === "/cn" || href === "/en") return `/${locale}`;
  if (href.startsWith("/cn/") || href.startsWith("/en/")) return `/${locale}${href.slice(3)}`;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}
function looksLikeBareDomain(value: string): boolean {
  return /^(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(value);
}

export function isExternalHref(href: string): boolean {
  const value = String(href ?? "").trim();
  return /^(?:https?:\/\/|mailto:|tel:)/i.test(value) || looksLikeBareDomain(value);
}

export function externalHref(href: string): string {
  const value = String(href ?? "").trim();
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return looksLikeBareDomain(value) ? `https://${value}` : value;
}

export function isHttpExternalHref(href: string): boolean {
  const value = String(href ?? "").trim();
  return isExternalHref(value) && !/^(?:mailto:|tel:)/i.test(value);
}
export function switchLocalePath(pathname: string | null | undefined, locale: Locale): string {
  const path = pathname || "/";
  const withoutLocale = path.replace(/^\/(cn|en)(?=\/|$)/, "") || "/";
  return withoutLocale === "/" ? `/${locale}` : `/${locale}${withoutLocale}`;
}

export const commonText = {
  en: {
    learnMore: "Learn more",
    buy: "Buy",
    viewAll: "View all products",
    contactSales: "Contact sales",
    readMore: "Read more",
    send: "Send",
    submit: "Submit",
    submitting: "Submitting...",
    submitInquiry: "Submit inquiry",
    sending: "Sending...",
    success: "Success",
    error: "Error",
    cookieTitle: "Cookies",
    cookieBody: "We use essential cookies to keep the admin session secure and preference cookies to remember your choices.",
    cookieNecessary: "Essential only",
    cookieAccept: "Accept",
    cookieLearnMore: "Learn more",
    name: "Name",
    email: "Email",
    company: "Company",
    country: "Country / region",
    projectType: "Project type",
    message: "Message",
    required: "Required",
    retailDistribution: "Retail distribution",
    oemOdm: "OEM / ODM",
    corporateGifting: "Corporate gifting",
    afterSalesSupport: "After-sales support",
    inquirySuccess: "Thank you. Your inquiry has been saved in the admin workspace.",
    inquiryError: "Please provide your name, email address, and message.",
    learnMoreBtn: "Learn more",
    buyBtn: "Buy",
    editPage: "Edit this section",
    editFooter: "Edit footer",
    loading: "Loading..."
    ,blueTitanium: "Blue Titanium", blueTitaniumSubtitle: "Cool metallic power for everyday carry.", pastelStack: "Pastel Stack", pastelStackSubtitle: "Soft colors made to look clean from every angle.", orange: "Orange", orangeSubtitle: "Bright, confident, and easy to find in a bag or workspace.", rose: "Rose", roseSubtitle: "A polished pink surface with a soft reflective glow.", usbCReady: "USB-C Ready", usbCReadySubtitle: "Designed for daily top-ups, travel, and shared desk power.", multiColor: "Multi Color", multiColorSubtitle: "A complete color family for retail display and gifting.", colorSeriesEyebrow: "Color Series", colorSeriesTitle: "A finish for every carry.", colorSeriesSubtitle: "Soft metallic colors, slim edges, and dependable mobile charging.", orangeEditionEyebrow: "Orange Edition", orangeEditionTitle: "Power that travels light.", orangeEditionSubtitle: "A compact body with USB-C charging and clear power indicators."
  },
  cn: {
    learnMore: "进一步了解",
    buy: "购买咨询",
    viewAll: "查看全部产品",
    contactSales: "联系销售",
    readMore: "阅读更多",
    send: "发送",
    submit: "提交",
    submitting: "提交中...",
    submitInquiry: "提交询盘",
    sending: "发送中...",
    success: "成功",
    error: "错误",
    cookieTitle: "Cookie 提示",
    cookieBody: "我们使用必要 Cookie 维持后台登录，并使用偏好 Cookie 记住你的选择。",
    cookieNecessary: "仅必要",
    cookieAccept: "接受",
    cookieLearnMore: "了解更多",
    name: "姓名",
    email: "电子邮箱",
    company: "公司",
    country: "国家 / 地区",
    projectType: "项目类型",
    message: "留言",
    required: "必填",
    retailDistribution: "零售分销",
    oemOdm: "OEM / ODM",
    corporateGifting: "企业礼品",
    afterSalesSupport: "售后服务",
    inquirySuccess: "感谢您的询盘。您的信息已保存至后台管理系统。",
    inquiryError: "请填写您的姓名、电子邮箱和留言内容。",
    learnMoreBtn: "了解更多",
    buyBtn: "购买咨询",
    editPage: "编辑此区域",
    editFooter: "编辑底部",
    loading: "加载中..."
    ,blueTitanium: "蓝钛金属款", blueTitaniumSubtitle: "冷冽金属质感，精巧口袋尺寸。", pastelStack: "马卡龙配色", pastelStackSubtitle: "柔和配色，从各个角度都干净利落。", orange: "橙色", orangeSubtitle: "明亮醒目，在包裹或工作台上轻松找到。", rose: "玫瑰粉", roseSubtitle: "抛光粉色表面，柔和反光质感。", usbCReady: "USB-C 直连", usbCReadySubtitle: "专为日常补电、旅行和共享桌面电源设计。", multiColor: "多彩系列", multiColorSubtitle: "完整配色体系，适合零售展示和企业礼品。", colorSeriesEyebrow: "彩色系列", colorSeriesTitle: "每一款配色，都是随身风格。", colorSeriesSubtitle: "柔和金属色泽、轻薄边缘、可靠移动充电。", orangeEditionEyebrow: "橙色特别款", orangeEditionTitle: "轻盈出行，随身电力。", orangeEditionSubtitle: "紧凑机身、USB-C 充电、清晰电量显示。"
  }
} satisfies Record<Locale, Record<string, string>>;

export const pageText = {
  en: {
    productsEyebrow: "SZA POWER",
    productsTitle: "Compact power, in every finish.",
    productsSubtitle: "Browse the current mobile power bank family, built around USB-C charging, clean surfaces, and retail-ready colors.",
    newsEyebrow: "Newsroom",
    newsTitle: "Product stories and market notes.",
    aboutEyebrow: "About SZA POWER",
    aboutTitle: "Making mobile power feel personal.",
    aboutSubtitle: "SZA POWER designs compact power banks for daily charging, retail display, and international distribution.",
    supportEyebrow: "Support",
    supportTitle: "Help for products, partners, and daily use.",
    contactEyebrow: "Contact",
    contactTitle: "Tell us what you want to build.",
    contactSubtitle: "Send a product, wholesale, OEM, or after-sales inquiry.",
    chargingBasics: "Charging basics",
    chargingBasicsCopy: "Use certified USB-C cables and adapters suitable for compact mobile power products.",
    batteryCare: "Battery care",
    batteryCareCopy: "Store the product in a cool, dry place and keep it charged for long-term storage.",
    warrantySupport: "Warranty support",
    warrantySupportCopy: "Submit purchase, market, and product details through the contact form for assistance.",
    distributionHelp: "Distribution help",
    distributionHelpCopy: "Retail and wholesale partners can request packaging, display, and logistics details.",
    moreInSeries: "More in the series.",
    specifications: "Specifications",
    designLed: "Design-led",
    designLedCopy: "Products are built around color, finish, and everyday carry behavior.",
    retailReady: "Retail-ready",
    retailReadyCopy: "Visual consistency, clear features, and package-friendly product stories.",
    globalMinded: "Global minded",
    globalMindedCopy: "A site and backend prepared for distributors, partners, and overseas buyers.",
    contactSzaPower: "SZA POWER",
    salesEmail: "sales@sza-power.example",
    locationText: "International mobile power brand website demo",
    contactDescription: "Product, wholesale, OEM, and support requests",
    color: "Color",
    capacity: "Capacity",
    input: "Input",
    output: "Output"
  },
  cn: {
    productsEyebrow: "SZA POWER",
    productsTitle: "每一种配色，都是随身电力。",
    productsSubtitle: "浏览当前移动电源产品系列：USB-C 充电、简洁表面，以及适合零售陈列的高质感色彩。",
    newsEyebrow: "资讯中心",
    newsTitle: "产品故事与市场动态。",
    aboutEyebrow: "关于 SZA POWER",
    aboutTitle: "让移动电源成为日常配件。",
    aboutSubtitle: "SZA POWER 设计适合日常充电、零售陈列和国际分销的精致移动电源。",
    supportEyebrow: "支持",
    supportTitle: "面向产品、合作伙伴和日常使用的支持。",
    contactEyebrow: "联系",
    contactTitle: "告诉我们你的合作需求。",
    contactSubtitle: "产品、批发、OEM 和售后需求均可直接提交。",
    chargingBasics: "充电基础",
    chargingBasicsCopy: "请使用通过认证的 USB-C 数据线和适配器为移动电源充电。",
    batteryCare: "电池保养",
    batteryCareCopy: "请将产品存放于阴凉干燥处，长期存放时保持一定电量。",
    warrantySupport: "保修支持",
    warrantySupportCopy: "请通过联系表单提交购买渠道、市场和产品信息以获得帮助。",
    distributionHelp: "分销支持",
    distributionHelpCopy: "零售和批发合作伙伴可索取包装、陈列和物流详情。",
    moreInSeries: "同系列更多产品。",
    specifications: "规格参数",
    designLed: "设计优先",
    designLedCopy: "产品围绕色彩、表面质感和日常携带体验打造。",
    retailReady: "零售就绪",
    retailReadyCopy: "视觉一致性、清晰功能特点、适合包装的产品叙事。",
    globalMinded: "全球视野",
    globalMindedCopy: "为分销商、合作伙伴和海外买家准备的网站与后台系统。",
    contactSzaPower: "SZA POWER",
    salesEmail: "sales@sza-power.example",
    locationText: "国际移动电源品牌网站演示",
    contactDescription: "产品、批发、OEM 和支持咨询",
    color: "颜色",
    capacity: "容量",
    input: "输入",
    output: "输出"
  }
} satisfies Record<Locale, Record<string, string>>;
