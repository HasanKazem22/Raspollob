import { apiFetch } from "@/lib/api";
import { HeroData, AboutUsData, ServiceData } from "@/types/home";

export const homeService = {
  // Hero Configuration API Methods
  async getHero(): Promise<{ success: boolean; data: HeroData }> {
    return apiFetch("/home/hero");
  },

  async updateHero(data: HeroData): Promise<{ success: boolean; data: HeroData }> {
    return apiFetch("/home/hero", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // About Us & Contact Info API Methods
  async getAboutUs(): Promise<{ success: boolean; data: AboutUsData }> {
    return apiFetch("/home/about");
  },

  async updateAboutUs(data: AboutUsData): Promise<{ success: boolean; data: AboutUsData }> {
    return apiFetch("/home/about", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Services Configuration API Methods
  async getAllServicesAdmin(): Promise<{ success: boolean; data: ServiceData[] }> {
    return apiFetch("/services/admin/all");
  },

  async getActiveServices(): Promise<{ success: boolean; data: ServiceData[] }> {
    return apiFetch("/services");
  },

  async createService(data: Partial<ServiceData>): Promise<{ success: boolean; data: ServiceData }> {
    return apiFetch("/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateService(id: number, data: Partial<ServiceData>): Promise<{ success: boolean; data: ServiceData }> {
    return apiFetch(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteService(id: number): Promise<{ success: boolean; data: void }> {
    return apiFetch(`/services/${id}`, {
      method: "DELETE",
    });
  },

  async uploadFile(file: File): Promise<{ success: boolean; data: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch("/files/upload", {
      method: "POST",
      body: formData,
    });
  },
};
