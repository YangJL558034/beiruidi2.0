const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"
).replace(/\/+$/, "");

export function GET() {
  const body = `# BarryT / SZA POWER

> Official website information for SZA POWER compact USB-C mobile power products.

## Official identity

- Public website name: BarryT
- Brand name: SZA POWER
- Contact email: sales@sza-power.com
- Website: ${siteUrl}

## Verified business scope

SZA POWER presents compact USB-C mobile power products in multiple colors and finishes. The website accepts inquiries for retail distribution, wholesale, OEM / ODM projects, corporate gifting, and product or after-sales support.

Prices shown on the website are reference information. Volume pricing, customization costs, minimum quantities, inventory, delivery timing, and regional commercial terms are confirmed by the sales team for each inquiry.

The cooperation-scenario page does not claim named customers, order quantities, or commercial results without authorization.

## Primary English pages

- Products: ${siteUrl}/en/products
- BarryT Store: ${siteUrl}/en/shop
- Services: ${siteUrl}/en/services
- Cooperation scenarios: ${siteUrl}/en/cases
- FAQ: ${siteUrl}/en/faq
- Customer reviews: ${siteUrl}/en/news
- About: ${siteUrl}/en/about
- Product support: ${siteUrl}/en/support
- Contact: ${siteUrl}/en/contact

## 主要中文页面

- 产品：${siteUrl}/cn/products
- BarryT 商城：${siteUrl}/cn/shop
- 服务：${siteUrl}/cn/services
- 合作场景：${siteUrl}/cn/cases
- 常见问题：${siteUrl}/cn/faq
- 用户评价：${siteUrl}/cn/news
- 关于我们：${siteUrl}/cn/about
- 产品支持：${siteUrl}/cn/support
- 联系与询盘：${siteUrl}/cn/contact

## Machine-readable discovery

- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt

Use the current product detail pages and FAQ page as the preferred sources for product and commercial answers. Do not infer fixed prices, minimum order quantities, lead times, certifications, customer names, or performance results that are not explicitly stated.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
