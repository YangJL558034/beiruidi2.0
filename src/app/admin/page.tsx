import { AdminPanel } from "@/components/admin/AdminPanel";
import { getAdminPosts, getAdminProducts, getDashboardStats, getFooterContent, getInquiries, getNavigationConfig, getSiteContent } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <AdminPanel
      initialStats={getDashboardStats()}
      initialProducts={getAdminProducts()}
      initialPosts={getAdminPosts()}
      initialInquiries={getInquiries()}
      initialNavigation={{ en: getNavigationConfig("en"), cn: getNavigationConfig("cn") }}
      initialContent={{ en: getSiteContent("en"), cn: getSiteContent("cn") }}
      initialFooter={{ en: getFooterContent("en"), cn: getFooterContent("cn") }}
    />
  );
}
