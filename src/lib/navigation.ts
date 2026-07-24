export type NavLink = {
  label: string;
  href: string;
  featured?: boolean;
};

export type Locale = "en" | "cn";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "cn" ? "cn" : "en";
}

export type NavColumn = {
  eyebrow: string;
  links: NavLink[];
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  columns: NavColumn[];
};

export type NavigationConfig = {
  brand: string;
  items: NavigationItem[];
};

export const defaultNavigationEn: NavigationConfig = {
  brand: "SZA",
  items: [
    {
      id: "products",
      label: "Products",
      href: "/products",
      columns: [
        {
          eyebrow: "Explore Products",
          links: [
            { label: "All Power Banks", href: "/products", featured: true },
            { label: "Blue Titanium", href: "/products/blue-titanium", featured: true },
            { label: "Pastel Stack", href: "/products/pastel-stack", featured: true },
            { label: "Orange Edition", href: "/products/orange-edition", featured: true },
            { label: "Rose Edition", href: "/products/rose-edition", featured: true }
          ]
        },
        {
          eyebrow: "Shop",
          links: [
            { label: "USB-C Ready", href: "/products/orange-edition" },
            { label: "Color Series", href: "/products/color-series-orange-stack" },
            { label: "Retail Display", href: "/contact" },
            { label: "OEM / ODM", href: "/contact" }
          ]
        },
        {
          eyebrow: "Product Support",
          links: [
            { label: "Charging Basics", href: "/support" },
            { label: "Battery Care", href: "/support" },
            { label: "Warranty", href: "/support" },
            { label: "Contact Sales", href: "/contact" }
          ]
        }
      ]
    },
    {
      id: "news",
      label: "News",
      href: "/news",
      columns: [
        {
          eyebrow: "Read",
          links: [
            { label: "Latest News", href: "/news", featured: true },
            { label: "Design Stories", href: "/news/color-material-design", featured: true },
            { label: "USB-C Daily Charging", href: "/news/usb-c-daily-charging", featured: true }
          ]
        },
        {
          eyebrow: "Topics",
          links: [
            { label: "Product", href: "/news" },
            { label: "Design", href: "/news" },
            { label: "Retail", href: "/news" }
          ]
        }
      ]
    },
    {
      id: "support",
      label: "Support",
      href: "/support",
      columns: [
        {
          eyebrow: "Get Support",
          links: [
            { label: "Support Home", href: "/support", featured: true },
            { label: "Charging Basics", href: "/support", featured: true },
            { label: "Warranty Support", href: "/contact", featured: true }
          ]
        },
        {
          eyebrow: "For Partners",
          links: [
            { label: "Distribution Help", href: "/contact" },
            { label: "OEM Requests", href: "/contact" },
            { label: "Retail Assets", href: "/contact" }
          ]
        }
      ]
    },
    {
      id: "about",
      label: "About",
      href: "/about",
      columns: [
        {
          eyebrow: "SZA POWER",
          links: [
            { label: "Company", href: "/about", featured: true },
            { label: "Product Philosophy", href: "/about", featured: true },
            { label: "International Partners", href: "/contact", featured: true }
          ]
        },
        {
          eyebrow: "More",
          links: [
            { label: "Newsroom", href: "/news" }
          ]
        }
      ]
    },
    {
      id: "contact",
      label: "Contact",
      href: "/contact",
      columns: [
        {
          eyebrow: "Start",
          links: [
            { label: "Contact Sales", href: "/contact", featured: true },
            { label: "Wholesale Inquiry", href: "/contact", featured: true },
            { label: "OEM / ODM Project", href: "/contact", featured: true }
          ]
        },
        {
          eyebrow: "Support",
          links: [
            { label: "Support", href: "/support" },
            { label: "Contact", href: "/contact" }
          ]
        }
      ]
    }
  ]
};

export const defaultNavigationCn: NavigationConfig = {
  "brand": "SZA",
  "items": [
    {
      "id": "products",
      "label": "产品",
      "href": "/products",
      "columns": [
        {
          "eyebrow": "探索产品",
          "links": [
            {
              "label": "全部产品",
              "href": "/products",
              "featured": true
            },
            {
              "label": "蓝钛金属款",
              "href": "/products/blue-titanium",
              "featured": true
            },
            {
              "label": "马卡龙配色",
              "href": "/products/pastel-stack",
              "featured": true
            },
            {
              "label": "橙色特别款",
              "href": "/products/orange-edition",
              "featured": true
            },
            {
              "label": "玫瑰粉款",
              "href": "/products/rose-edition",
              "featured": true
            }
          ]
        },
        {
          "eyebrow": "购买与合作",
          "links": [
            {
              "label": "USB-C 便携款",
              "href": "/products/orange-edition",
              "featured": false
            },
            {
              "label": "全色系陈列",
              "href": "/products/color-series-orange-stack",
              "featured": false
            },
            {
              "label": "零售陈列合作",
              "href": "/contact",
              "featured": false
            },
            {
              "label": "OEM / ODM 定制",
              "href": "/contact",
              "featured": false
            }
          ]
        },
        {
          "eyebrow": "产品支持",
          "links": [
            {
              "label": "充电说明",
              "href": "/support",
              "featured": false
            },
            {
              "label": "电池保养",
              "href": "/support",
              "featured": false
            },
            {
              "label": "质保服务",
              "href": "/support",
              "featured": false
            },
            {
              "label": "联系销售",
              "href": "/contact",
              "featured": false
            }
          ]
        }
      ]
    },
    {
      "id": "news",
      "label": "资讯",
      "href": "/news",
      "columns": [
        {
          "eyebrow": "阅读",
          "links": [
            {
              "label": "最新资讯",
              "href": "/news",
              "featured": true
            },
            {
              "label": "色彩与材质设计",
              "href": "/news/color-material-design",
              "featured": true
            },
            {
              "label": "USB-C 日常充电",
              "href": "/news/usb-c-daily-charging",
              "featured": true
            }
          ]
        },
        {
          "eyebrow": "主题",
          "links": [
            {
              "label": "产品",
              "href": "/news",
              "featured": false
            },
            {
              "label": "设计",
              "href": "/news",
              "featured": false
            },
            {
              "label": "零售",
              "href": "/news",
              "featured": false
            }
          ]
        }
      ]
    },
    {
      "id": "support",
      "label": "支持",
      "href": "/support",
      "columns": [
        {
          "eyebrow": "获取支持",
          "links": [
            {
              "label": "支持首页",
              "href": "/support",
              "featured": true
            },
            {
              "label": "充电基础",
              "href": "/support",
              "featured": true
            },
            {
              "label": "质保支持",
              "href": "/contact",
              "featured": true
            }
          ]
        },
        {
          "eyebrow": "合作伙伴",
          "links": [
            {
              "label": "分销支持",
              "href": "/contact",
              "featured": false
            },
            {
              "label": "OEM 项目",
              "href": "/contact",
              "featured": false
            },
            {
              "label": "零售素材",
              "href": "/contact",
              "featured": false
            }
          ]
        }
      ]
    },
    {
      "id": "about",
      "label": "关于",
      "href": "/about",
      "columns": [
        {
          "eyebrow": "SZA POWER",
          "links": [
            {
              "label": "公司介绍",
              "href": "/about",
              "featured": true
            },
            {
              "label": "产品理念",
              "href": "/about",
              "featured": true
            },
            {
              "label": "国际合作",
              "href": "/contact",
              "featured": true
            }
          ]
        }
      ]
    },
    {
      "id": "contact",
      "label": "联系",
      "href": "/contact",
      "columns": [
        {
          "eyebrow": "开始合作",
          "links": [
            {
              "label": "联系销售",
              "href": "/contact",
              "featured": true
            },
            {
              "label": "批发咨询",
              "href": "/contact",
              "featured": true
            },
            {
              "label": "OEM / ODM 项目",
              "href": "/contact",
              "featured": true
            },
            {
              "label": "山泽新能源科技",
              "href": "https://www.shanzexny.com",
              "featured": true
            }
          ]
        }
      ]
    }
  ]
};

export const defaultNavigationByLocale: Record<Locale, NavigationConfig> = {
  en: defaultNavigationEn,
  cn: defaultNavigationCn
};

export const defaultNavigation = defaultNavigationEn;

export function withIndustryNavigation(
  navigation: NavigationConfig,
  locale: Locale,
): NavigationConfig {
  const serviceItem: NavigationItem = {
    id: "services",
    label: locale === "cn" ? "服务" : "Services",
    href: "/services",
    columns: [
      {
        eyebrow: locale === "cn" ? "商业服务" : "Business services",
        links: [
          {
            label: locale === "cn" ? "全部服务" : "All services",
            href: "/services",
            featured: true,
          },
          {
            label: locale === "cn" ? "批发与分销" : "Wholesale and distribution",
            href: "/services#distribution",
            featured: true,
          },
          {
            label: locale === "cn" ? "OEM / ODM" : "OEM / ODM",
            href: "/services#oem",
            featured: true,
          },
          {
            label: locale === "cn" ? "企业礼赠" : "Corporate gifting",
            href: "/services#gifting",
            featured: false,
          },
        ],
      },
      {
        eyebrow: locale === "cn" ? "决策支持" : "Decision support",
        links: [
          {
            label: locale === "cn" ? "合作场景" : "Cooperation scenarios",
            href: "/cases",
          },
          { label: "FAQ", href: "/faq" },
          {
            label: locale === "cn" ? "提交询盘" : "Send an inquiry",
            href: "/contact",
          },
        ],
      },
    ],
  };
  const casesItem: NavigationItem = {
    id: "cases",
    label: locale === "cn" ? "合作场景" : "Solutions",
    href: "/cases",
    columns: [],
  };
  const existingIds = new Set(navigation.items.map((item) => item.id));
  const items = [...navigation.items];
  const productIndex = Math.max(
    0,
    items.findIndex((item) => item.id === "products"),
  );
  let insertAt = productIndex + 1;
  if (!existingIds.has("services")) {
    items.splice(insertAt, 0, serviceItem);
    insertAt += 1;
  }
  if (!existingIds.has("cases")) items.splice(insertAt, 0, casesItem);

  return {
    ...navigation,
    items: items.map((item) => {
      if (item.id === "news") {
        return {
          ...item,
          label: locale === "cn" ? "用户评价" : "Reviews",
          columns: [],
        };
      }
      if (item.id !== "support" || !item.columns.length) return item;
      const first = item.columns[0];
      if (first.links.some((link) => link.href === "/faq")) return item;
      return {
        ...item,
        columns: [
          {
            ...first,
            links: [
              ...first.links,
              {
                label: locale === "cn" ? "常见问题" : "FAQ",
                href: "/faq",
                featured: true,
              },
            ],
          },
          ...item.columns.slice(1),
        ],
      };
    }),
  };
}
