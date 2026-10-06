import { apiFetch } from "@/lib/api";
import { RealAsset, AssetStatus } from "@/types/real-asset";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const realAssetService = {
  /** Public/admin search — pass status to filter, query for full-text search */
  async getAssets(query?: string, status?: AssetStatus): Promise<ApiResponse<RealAsset[]>> {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (status) params.append("status", status);
    const qs = params.toString();
    return apiFetch(`/real-assets${qs ? `?${qs}` : ""}`, { requireAuth: false });
  },

  async getAssetById(id: number): Promise<ApiResponse<RealAsset>> {
    return apiFetch(`/real-assets/${id}`, { requireAuth: false });
  },

  async createAsset(dto: Partial<RealAsset>): Promise<ApiResponse<RealAsset>> {
    return apiFetch("/real-assets", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  async updateAsset(id: number, dto: Partial<RealAsset>): Promise<ApiResponse<RealAsset>> {
    return apiFetch(`/real-assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
  },

  async deleteAsset(id: number): Promise<ApiResponse<void>> {
    return apiFetch(`/real-assets/${id}`, { method: "DELETE" });
  },
};
