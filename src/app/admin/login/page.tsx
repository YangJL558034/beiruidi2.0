import { Suspense } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}
