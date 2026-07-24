import type { AdminRole } from "@/lib/content-types";

export type AdminModuleId =
  | "overview"
  | "brand"
  | "content"
  | "navigation"
  | "footer"
  | "products"
  | "shop"
  | "posts"
  | "inquiries"
  | "supportDesk"
  | "operations"
  | "system";

const roleModules: Record<AdminRole, readonly AdminModuleId[]> = {
  owner: [
    "overview",
    "brand",
    "content",
    "navigation",
    "footer",
    "products",
    "shop",
    "posts",
    "inquiries",
    "supportDesk",
    "operations",
    "system",
  ],
  editor: ["overview", "content", "products", "shop", "posts", "inquiries"],
  support: ["overview", "inquiries", "supportDesk"],
  sales: ["overview", "supportDesk"],
};

export function canAccessAdminModule(role: AdminRole, module: AdminModuleId) {
  return roleModules[role].includes(module);
}

export function canAccessAdminApi(role: AdminRole, pathname: string) {
  if (role === "owner") return true;
  if (pathname === "/api/admin/change-password") return true;
  if (role === "support")
    return (
      pathname === "/api/admin/inquiries" ||
      pathname === "/api/admin/monitoring" ||
      pathname.startsWith("/api/admin/support")
    );
  if (role === "sales") return pathname.startsWith("/api/admin/support");
  return [
    "/api/admin/products",
    "/api/admin/posts",
    "/api/admin/site-content",
    "/api/admin/media",
    "/api/admin/inquiries",
    "/api/admin/monitoring",
  ].includes(pathname);
}
