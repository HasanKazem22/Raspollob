"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PERM } from "@/lib/permissions";
import { firstAllowedAdminPath } from "@/components/admin/adminNav";
import { Loader } from "@/components/ui/loader";
import { DashboardTab } from "./_components/DashboardTab";

/**
 * The dashboard has its own compact greeting header instead of the centered page header.
 * Staff without dashboard access land on the first admin page their role allows.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { isReady, can } = useAuth();
  const canSeeDashboard = can(PERM.dashboard.access);
  const fallbackPath = isReady && !canSeeDashboard ? firstAllowedAdminPath(can) : null;

  useEffect(() => {
    if (fallbackPath && fallbackPath !== "/admin") router.replace(fallbackPath);
  }, [fallbackPath, router]);

  if (!isReady || fallbackPath) return <Loader text="Opening admin panel..." />;
  return <DashboardTab />;
}
