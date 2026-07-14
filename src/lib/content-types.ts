export type AdminRole = "owner" | "editor" | "support";
export type ProductStatus = "draft" | "published";

export type Product = {
  id: number;
  slug: string;
  name: string;
  nameCn: string;
  subtitle: string;
  subtitleCn: string;
  description: string;
  descriptionCn: string;
  color: string;
  colorCn: string;
  capacity: string;
  capacityCn: string;
  input: string;
  output: string;
  price: string;
  priceCn: string;
  image: string;
  images: string[];
  featured: boolean;
  sortOrder: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type LocalizedProduct = Omit<
  Product,
  "nameCn" | "subtitleCn" | "descriptionCn" | "colorCn" | "capacityCn" | "priceCn"
>;

export type Post = {
  id: number;
  slug: string;
  title: string;
  titleCn: string;
  excerpt: string;
  excerptCn: string;
  content: string;
  contentCn: string;
  category: string;
  categoryCn: string;
  image: string;
  status: ProductStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalizedPost = Omit<Post, "titleCn" | "excerptCn" | "contentCn" | "categoryCn">;

export type Inquiry = {
  id: number;
  name: string;
  email: string;
  company: string;
  country: string;
  projectType: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
};

export type DashboardStats = {
  products: number;
  posts: number;
  newInquiries: number;
  publishedProducts: number;
};

export type PageMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt?: string;
};

export type SitePageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  media?: PageMedia;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  sections?: SiteContentSection[];
};

export type SiteContentSection = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  media?: PageMedia;
};

export type SiteContent = {
  home: SitePageContent;
  products: SitePageContent;
  news: SitePageContent;
  about: SitePageContent;
  support: SitePageContent;
  contact: SitePageContent;
  privacy: SitePageContent;
  terms: SitePageContent;
};

export type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export type FooterContent = {
  disclaimer: string;
  copyright: string;
  legalLinks: Array<{ label: string; href: string }>;
  columns: FooterColumn[];
  socialLinks?: Array<{
    platform: "douyin" | "tiktok" | "youtube" | "x" | "instagram" | "facebook" | "kuaishou" | "bilibili" | "weibo";
    label: string;
    href: string;
  }>;
  icpNumber?: string;
};
export type AccessLog = {
  id: number;
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  referer: string;
  createdAt: string;
};

export type SecurityEvent = {
  id: number;
  type: string;
  severity: "info" | "warning" | "critical";
  ip: string;
  actor: string;
  detail: string;
  createdAt: string;
};