import { apiFetch } from "@/lib/api";

export interface ContactMessageRequest {
  name: string;
  phone: string;
  question: string;
}

export interface ContactMessageResponse {
  id: number;
  name: string;
  phone: string;
  question: string;
  isRead: boolean;
  createdAt: string;
}

export const contactService = {
  async submitMessage(data: ContactMessageRequest): Promise<void> {
    await apiFetch("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getAllMessages(): Promise<ContactMessageResponse[]> {
    const res = await apiFetch("/admin/contact");
    return res.data;
  },

  async markAsRead(id: number): Promise<void> {
    await apiFetch(`/admin/contact/${id}/read`, {
      method: "PATCH",
    });
  }
};
