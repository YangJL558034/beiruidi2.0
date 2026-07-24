import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self';" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : [])
];
const allowedDevOrigins = (
  process.env.SZA_ALLOWED_DEV_ORIGINS ?? "127.0.0.1,localhost"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
  async redirects() {
    return [
      { source: "/product", destination: "/products", permanent: true },
      {
        source: "/:locale(cn|en)/product",
        destination: "/:locale/products",
        permanent: true,
      },
      { source: "/blog", destination: "/news", permanent: true },
      {
        source: "/:locale(cn|en)/blog",
        destination: "/:locale/news",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/news/:slug",
        permanent: true,
      },
      {
        source: "/:locale(cn|en)/blog/:slug",
        destination: "/:locale/news/:slug",
        permanent: true,
      },
    ];
  },
  allowedDevOrigins
};

export default nextConfig;
