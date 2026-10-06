import { apiFetch, ApiResponse } from "@/lib/api";
import type { DashboardData, DashboardPeriod } from "@/types/dashboard";

export const dashboardService = {
  async get(period: DashboardPeriod): Promise<DashboardData> {
    const res: ApiResponse<DashboardData> = await apiFetch(`/admin/dashboard?period=${period}`);
    return res.data;
  },
};
