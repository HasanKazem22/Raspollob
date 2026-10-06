import { apiFetch, ApiResponse, Page } from "@/lib/api";
import { Product } from "@/types/product";

export const productService = {
  /** Fetch public products with search, category and pagination */
  async getProducts(query?: string, categoryId?: number | string, page = 0, size = 12): Promise<ApiResponse<Page<Product>>> {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (categoryId) params.append("categoryId", String(categoryId));
    params.append("page", String(page));
    params.append("size", String(size));

    const queryString = params.toString();
    return apiFetch(`/products${queryString ? `?${queryString}` : ""}`, {
      requireAuth: false,
    });
  },

  /** Fetch trending products for home page */
  async getTrendingProducts(limit = 10): Promise<ApiResponse<Product[]>> {
    return apiFetch(`/products/trending?limit=${limit}`, {
      requireAuth: false,
    });
  },

  /** Get single product details */
  async getProductById(idOrSlug: string | number): Promise<ApiResponse<Product>> {
    return apiFetch(`/products/${idOrSlug}`, {
      requireAuth: false,
    });
  },

  /** Admin: Fetch paginated products with cost & margin metrics */
  async getAdminProducts(categoryId?: number, query?: string, page = 0, size = 20): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (categoryId) params.append("categoryId", String(categoryId));
    if (query) params.append("query", query);
    params.append("page", String(page));
    params.append("size", String(size));

    const queryString = params.toString();
    return apiFetch(`/admin/products${queryString ? `?${queryString}` : ""}`);
  },

  /** Admin: One product with all of its sizes (including hidden ones) */
  async getAdminProduct(id: number): Promise<ApiResponse<Product>> {
    return apiFetch(`/admin/products/${id}`);
  },

  /** Admin: Create a product */
  async createProduct(dto: any): Promise<ApiResponse<Product>> {
    return apiFetch("/admin/products", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  /** Admin: Update product details */
  async updateProduct(id: number, dto: any): Promise<ApiResponse<Product>> {
    return apiFetch(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
  },

  /** Admin: Toggle isTrending directly from table row */
  async toggleTrending(id: number, isTrending: boolean): Promise<ApiResponse<Product>> {
    return apiFetch(`/admin/products/${id}/trending`, {
      method: "PATCH",
      body: JSON.stringify({ isTrending }),
    });
  },

  /** Admin: Delete a product (automatically removes image files) */
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiFetch(`/admin/products/${id}`, {
      method: "DELETE",
    });
  },
};

