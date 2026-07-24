import type { Locale } from "@/lib/navigation";

export type ServiceItem = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
};

export type CaseScenario = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  needs: string[];
  href: string;
  image: string;
};

export type IndustryFaq = {
  question: string;
  answer: string;
};

export const servicesContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    intro: string;
    items: ServiceItem[];
    processTitle: string;
    process: Array<{ title: string; description: string }>;
  }
> = {
  en: {
    eyebrow: "Business services",
    title: "A clear path from product selection to delivery.",
    description:
      "SZA POWER supports wholesale, retail, OEM / ODM, corporate gifting, and after-sales product inquiries for compact USB-C power banks.",
    intro:
      "Every project starts with the intended market, product specification, quantity, customization scope, and delivery destination. Pricing and schedules are confirmed only after those requirements are reviewed.",
    items: [
      {
        id: "distribution",
        title: "Wholesale and distribution",
        summary:
          "Product selection, regional quotation, retail presentation, packaging information, and logistics coordination for distributors and retailers.",
        deliverables: [
          "Current product and finish selection",
          "Volume and regional quotation",
          "Packaging and retail information",
        ],
      },
      {
        id: "oem",
        title: "OEM / ODM project support",
        summary:
          "Requirement review for product finish, color, branding, packaging, and other project-specific details.",
        deliverables: [
          "Requirement and feasibility review",
          "Specification and appearance confirmation",
          "Project quotation and next-step plan",
        ],
      },
      {
        id: "gifting",
        title: "Corporate gifting",
        summary:
          "Compact power products prepared for branded gifting, campaign use, and coordinated color or packaging requirements.",
        deliverables: [
          "Product matching by use case",
          "Branding and packaging discussion",
          "Delivery requirement confirmation",
        ],
      },
      {
        id: "support",
        title: "Product and after-sales support",
        summary:
          "Charging guidance, product-care information, warranty intake, and issue routing through one support channel.",
        deliverables: [
          "Charging and care guidance",
          "Warranty information intake",
          "Product issue follow-up",
        ],
      },
    ],
    processTitle: "How a commercial inquiry works",
    process: [
      {
        title: "Share requirements",
        description:
          "Tell us the target market, product, quantity, customization needs, and delivery destination.",
      },
      {
        title: "Review and match",
        description:
          "The sales team reviews the request and matches suitable products or project options.",
      },
      {
        title: "Confirm commercial terms",
        description:
          "Pricing, availability, customization scope, samples, and timing are confirmed in writing.",
      },
      {
        title: "Proceed with the project",
        description:
          "The project moves forward only after the agreed specification and commercial terms are confirmed.",
      },
    ],
  },
  cn: {
    eyebrow: "商业服务",
    title: "从产品选择到项目交付，路径清晰。",
    description:
      "SZA POWER 为紧凑型 USB-C 移动电源提供批发、零售、OEM / ODM、企业礼赠和售后咨询支持。",
    intro:
      "每个项目都从目标市场、产品规格、数量、定制范围和交付地区开始。销售团队完成需求确认后，才会提供对应的价格与时间安排。",
    items: [
      {
        id: "distribution",
        title: "批发与分销",
        summary:
          "为分销商和零售合作伙伴提供产品选择、区域报价、零售陈列、包装信息与物流协调。",
        deliverables: [
          "现有产品与配色选择",
          "批量及区域报价",
          "包装与零售信息",
        ],
      },
      {
        id: "oem",
        title: "OEM / ODM 项目支持",
        summary:
          "围绕产品表面、颜色、品牌呈现、包装和其他项目要求进行需求与可行性确认。",
        deliverables: [
          "需求与可行性确认",
          "规格和外观确认",
          "项目报价与下一步计划",
        ],
      },
      {
        id: "gifting",
        title: "企业礼赠",
        summary:
          "针对品牌礼赠、市场活动以及统一配色或包装需求，匹配适合的紧凑型移动电源。",
        deliverables: [
          "按使用场景匹配产品",
          "品牌呈现与包装沟通",
          "交付需求确认",
        ],
      },
      {
        id: "support",
        title: "产品与售后支持",
        summary:
          "通过统一入口提供充电说明、产品保养、质保受理和问题跟进。",
        deliverables: [
          "充电与保养说明",
          "质保信息受理",
          "产品问题跟进",
        ],
      },
    ],
    processTitle: "商业询盘如何推进",
    process: [
      {
        title: "提交需求",
        description:
          "说明目标市场、产品、数量、定制要求和交付地区。",
      },
      {
        title: "需求审核与匹配",
        description:
          "销售团队审核需求，并匹配合适的现有产品或项目方案。",
      },
      {
        title: "确认商务条款",
        description:
          "以书面方式确认价格、供货状态、定制范围、样品与时间安排。",
      },
      {
        title: "项目执行",
        description:
          "双方确认规格与商务条款后，项目才进入下一阶段。",
      },
    ],
  },
};

export const caseContent: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    disclosure: string;
    scenarios: CaseScenario[];
  }
> = {
  en: {
    eyebrow: "Cooperation scenarios",
    title: "Product solutions shaped around real buying needs.",
    description:
      "These scenarios explain how current SZA POWER products can support common commercial requirements without publishing unapproved customer names or unverified performance claims.",
    disclosure:
      "Customer identities, order quantities, and commercial results are not published without authorization. Final specifications and terms are confirmed for each inquiry.",
    scenarios: [
      {
        id: "retail",
        eyebrow: "Retail distribution",
        title: "A coordinated color family for retail presentation",
        summary:
          "Multiple finishes can be reviewed as one compact product family for store display, regional assortment, and wholesale quotation.",
        needs: ["Product assortment", "Retail-ready visuals", "Regional quote"],
        href: "/products",
        image: "/products/web/power-stack-blue.webp",
      },
      {
        id: "oem",
        eyebrow: "OEM / ODM",
        title: "A structured route for customization requirements",
        summary:
          "Color, finish, branding, packaging, quantity, and destination are reviewed before feasibility, price, and timing are confirmed.",
        needs: ["Requirement review", "Appearance confirmation", "Project terms"],
        href: "/services",
        image: "/products/web/power-stack-orange.webp",
      },
      {
        id: "gifting",
        eyebrow: "Corporate gifting",
        title: "Compact mobile power for branded programs",
        summary:
          "Product selection can be aligned with campaign use, color direction, packaging expectations, and delivery requirements.",
        needs: ["Use-case matching", "Brand presentation", "Delivery planning"],
        href: "/contact",
        image: "/products/web/power-stack-pink-vertical.webp",
      },
    ],
  },
  cn: {
    eyebrow: "合作场景",
    title: "围绕真实采购需求组织产品方案。",
    description:
      "以下内容说明现有 SZA POWER 产品如何支持常见商业需求，不展示未经授权的客户名称，也不使用未经核实的业绩数据。",
    disclosure:
      "客户身份、订单数量和商业结果仅在获得授权后公开。每个项目的最终规格与条款均以单独确认结果为准。",
    scenarios: [
      {
        id: "retail",
        eyebrow: "零售分销",
        title: "适合零售陈列的统一配色产品系列",
        summary:
          "可将多种表面与配色作为紧凑型产品系列，用于门店陈列、区域选品与批发报价。",
        needs: ["产品组合", "零售视觉", "区域报价"],
        href: "/products",
        image: "/products/web/power-stack-blue.webp",
      },
      {
        id: "oem",
        eyebrow: "OEM / ODM",
        title: "结构化确认定制项目要求",
        summary:
          "先确认颜色、表面、品牌呈现、包装、数量和交付地区，再评估可行性、价格与时间。",
        needs: ["需求审核", "外观确认", "项目条款"],
        href: "/services",
        image: "/products/web/power-stack-orange.webp",
      },
      {
        id: "gifting",
        eyebrow: "企业礼赠",
        title: "适合品牌项目的紧凑型移动电源",
        summary:
          "产品选择可结合活动用途、配色方向、包装预期与交付要求进行匹配。",
        needs: ["场景匹配", "品牌呈现", "交付规划"],
        href: "/contact",
        image: "/products/web/power-stack-pink-vertical.webp",
      },
    ],
  },
};

export const industryFaqs: Record<Locale, IndustryFaq[]> = {
  en: [
    {
      question: "What products does SZA POWER provide?",
      answer:
        "SZA POWER provides compact USB-C mobile power products in multiple colors and finishes for everyday use, retail distribution, wholesale, gifting, and project inquiries.",
    },
    {
      question: "Does SZA POWER support wholesale and distribution inquiries?",
      answer:
        "Yes. Distributors and retailers can submit the target market, preferred products, quantity, and destination to request availability, packaging information, and a regional quotation.",
    },
    {
      question: "Can I request OEM or ODM customization?",
      answer:
        "Yes. OEM and ODM inquiries can include color, finish, branding, packaging, quantity, and destination. Feasibility, minimum quantity, price, samples, and lead time are confirmed after review rather than published as fixed terms.",
    },
    {
      question: "How do I get an accurate quotation?",
      answer:
        "Use the inquiry form and include the product or specification, expected quantity, customization scope, destination, and target schedule. The sales team confirms the quotation after reviewing those details.",
    },
    {
      question: "Are prices and inventory on the website final?",
      answer:
        "No. Website prices are reference information. Volume pricing, customization costs, regional terms, inventory, and delivery timing are confirmed by the sales team.",
    },
    {
      question: "How can I request product or warranty support?",
      answer:
        "Submit the product model, purchase channel, market, and a clear description of the issue through the contact form. The request will be routed for follow-up.",
    },
  ],
  cn: [
    {
      question: "SZA POWER 提供哪些产品？",
      answer:
        "SZA POWER 提供多种颜色和表面工艺的紧凑型 USB-C 移动电源，适用于日常使用、零售分销、批发、企业礼赠和项目合作咨询。",
    },
    {
      question: "是否支持批发和分销合作？",
      answer:
        "支持。分销商和零售合作伙伴可以提交目标市场、意向产品、数量和交付地区，以获取供货状态、包装信息和区域报价。",
    },
    {
      question: "是否支持 OEM 或 ODM 定制？",
      answer:
        "支持。OEM 和 ODM 需求可以包括颜色、表面、品牌呈现、包装、数量和交付地区。可行性、起订数量、价格、样品和交期会在审核后确认，不作为固定条件公开。",
    },
    {
      question: "如何获得准确报价？",
      answer:
        "请通过询盘表单说明产品或规格、预计数量、定制范围、交付地区和目标时间。销售团队审核这些信息后提供对应报价。",
    },
    {
      question: "网站上的价格和库存是否为最终结果？",
      answer:
        "不是。网站价格属于参考信息，批量价格、定制费用、区域条款、库存和交付时间均以销售团队确认为准。",
    },
    {
      question: "如何申请产品或质保支持？",
      answer:
        "请通过联系表单提交产品型号、购买渠道、所在市场和清晰的问题说明，相关请求会被安排跟进。",
    },
  ],
};
