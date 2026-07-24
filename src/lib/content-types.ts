export type AdminRole = "owner" | "editor" | "support" | "sales";
export type ProductStatus = "draft" | "published";
export type InventoryStatus = "in_stock" | "preorder" | "out_of_stock";

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
  compareAtPrice: string;
  compareAtPriceCn: string;
  sku: string;
  shopEnabled: boolean;
  inventoryStatus: InventoryStatus;
  image: string;
  images: string[];
  video: string;
  featured: boolean;
  sortOrder: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type LocalizedProduct = Omit<
  Product,
  | "nameCn"
  | "subtitleCn"
  | "descriptionCn"
  | "colorCn"
  | "capacityCn"
  | "priceCn"
  | "compareAtPriceCn"
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

export type LocalizedPost = Omit<
  Post,
  "titleCn" | "excerptCn" | "contentCn" | "categoryCn"
>;

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
  position?: string;
};

export type Testimonial = {
  id: string;
  visible?: boolean;
  name: string;
  role?: string;
  company?: string;
  country?: string;
  rating: number;
  quote: string;
  avatar?: PageMedia;
  images?: PageMedia[];
  /**
   * Legacy field kept only while existing saved reviews are migrated.
   * New editors must write avatar and images separately.
   */
  media?: PageMedia;
};

export type SitePageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  media?: PageMedia;
  primaryLabel?: string;
  primaryHref?: string;
  primaryTarget?: "_self" | "_blank";
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryTarget?: "_self" | "_blank";
  sections?: SiteContentSection[];
  notice?: string;
  metrics?: Array<{ value: string; label: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  testimonials?: Testimonial[];
  resources?: Array<{
    title: string;
    description: string;
    label: string;
    href: string;
  }>;
  lastUpdated?: string;
  labels?: Record<string, string>;
};

export type SiteContentSection = {
  id: string;
  visible?: boolean;
  locked?: boolean;
  eyebrow?: string;
  title: string;
  subtitle: string;
  items?: string[];
  primaryLabel?: string;
  primaryHref?: string;
  primaryTarget?: "_self" | "_blank";
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryTarget?: "_self" | "_blank";
  media?: PageMedia;
};

export type SiteContent = {
  home: SitePageContent;
  products: SitePageContent;
  shop: SitePageContent;
  services: SitePageContent;
  cases: SitePageContent;
  faq: SitePageContent;
  news: SitePageContent;
  about: SitePageContent;
  support: SitePageContent;
  contact: SitePageContent;
  privacy: SitePageContent;
  terms: SitePageContent;
};

export type ContentVersion = {
  id: string;
  createdAt: string;
  actor: string;
  content: SiteContent;
};

export type ContentWorkspace = {
  published: SiteContent;
  draft: SiteContent;
  hasDraft: boolean;
  draftUpdatedAt: string;
  publishedAt: string;
  versions: ContentVersion[];
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
    platform:
      | "douyin"
      | "tiktok"
      | "youtube"
      | "x"
      | "instagram"
      | "facebook"
      | "kuaishou"
      | "bilibili"
      | "weibo";
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
