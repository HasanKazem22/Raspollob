import { apiFetch, ApiResponse } from "@/lib/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  showInNavbar: boolean;
  showInHome: boolean;
  isActive: boolean;
  productCount?: number;
}

export const categoryService = {
  /** Fetch active categories for public/store */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiFetch("/categories", {
      requireAuth: false,
    });
  },

  /** Public: Fetch categories configured to show in Navbar */
  async getNavbarCategories(): Promise<ApiResponse<Category[]>> {
    return apiFetch("/categories/navbar", {
      requireAuth: false,
    });
  },

  /** Public: Fetch categories configured to show in Home 'Shop by Category' */
  async getHomeCategories(): Promise<ApiResponse<Category[]>> {
    return apiFetch("/categories/home", {
      requireAuth: false,
    });
  },

  /** Admin: Fetch all categories */
  async getAdminCategories(): Promise<ApiResponse<Category[]>> {
    return apiFetch("/admin/categories");
  },

  /** Admin: Create category */
  async createCategory(dto: Partial<Category>): Promise<ApiResponse<Category>> {
    return apiFetch("/admin/categories", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  /** Admin: Update category */
  async updateCategory(id: number, dto: Partial<Category>): Promise<ApiResponse<Category>> {
    return apiFetch(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
  },

  /** Admin: Toggle Show In Navbar */
  async toggleNavbar(id: number, show: boolean): Promise<ApiResponse<Category>> {
    return apiFetch(`/admin/categories/${id}/toggle-navbar?show=${show}`, {
      method: "PATCH",
    });
  },

  /** Admin: Toggle Show In Home */
  async toggleHome(id: number, show: boolean): Promise<ApiResponse<Category>> {
    return apiFetch(`/admin/categories/${id}/toggle-home?show=${show}`, {
      method: "PATCH",
    });
  },

  /** Admin: Delete category */
  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return apiFetch(`/admin/categories/${id}`, {
      method: "DELETE",
    });
  },
};

