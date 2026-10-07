import { apiFetch } from "@/lib/api";

/** The signed-in user's own profile, as stored on the server. */
export interface Account {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  mobile: string;
  city?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  roles: string[];
}

export interface AccountUpdate {
  fullName: string;
  email?: string;
  mobile: string;
  city?: string;
  address?: string;
}

export const accountService = {
  async getMe(): Promise<Account> {
    const res = await apiFetch("/account/me");
    return res.data;
  },

  async updateMe(update: AccountUpdate): Promise<Account> {
    const res = await apiFetch("/account/me", { method: "PUT", body: JSON.stringify(update) });
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch("/account/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /** Uploads a new profile photo; the server resizes it and removes the old one. */
  async uploadAvatar(file: File): Promise<Account> {
    const form = new FormData();
    form.append("file", file);
    const res = await apiFetch("/account/me/avatar", { method: "POST", body: form });
    return res.data;
  },

  async removeAvatar(): Promise<Account> {
    const res = await apiFetch("/account/me/avatar", { method: "DELETE" });
    return res.data;
  },
};
