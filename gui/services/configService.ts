import { apiFetch } from "@/lib/api";

export interface CustomerReview {
  name: string;
  rating: number;
  comment: string;
  profileImage?: string;
}

export interface StoreConfig {
  id?: number;
  storeLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroBannerImages: string[];
  promoBannerImage: string;
  categorySectionTitle: string;
  categorySectionDesc: string;
  trendingSectionTitle: string;
  trendingSectionDesc: string;
  justForYouSectionTitle?: string;
  justForYouSectionDesc?: string;
  contactUsInfo: string;
  shippingDeliveryInfo: string;
  returnsRefundsInfo: string;
  faqsInfo: string;
  trackOrderInfo: string;
  needHelpInfo: string;
  facebookUrl?: string;
  facebookActive?: boolean;
  instagramUrl?: string;
  instagramActive?: boolean;
  youtubeUrl?: string;
  youtubeActive?: boolean;
  tiktokUrl?: string;
  tiktokActive?: boolean;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeHours?: string;
  customerReviews: CustomerReview[];

  // Checkout & payments (server applies defaults when unset)
  shippingFeeInsideDhaka?: number;
  shippingFeeOutsideDhaka?: number;
  /** Subtotal for free shipping; null = disabled */
  freeShippingThreshold?: number | null;
  codEnabled?: boolean;
  /** Blank = payment method disabled */
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  paymentInstructions?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** `faqsInfo` is stored as a JSON string; returns [] when empty or malformed. */
export function parseFaqs(faqsRaw?: string): FaqItem[] {
  try {
    return faqsRaw ? JSON.parse(faqsRaw) : [];
  } catch {
    return [];
  }
}

export const getStoreConfig = async (): Promise<StoreConfig> => {
  const res = await apiFetch("/config/store", {
    method: "GET",
    requireAuth: false,
  });
  return res.data;
};

export const updateStoreConfig = async (config: StoreConfig): Promise<StoreConfig> => {
  const res = await apiFetch("/admin/config/store", {
    method: "PUT",
    body: JSON.stringify(config),
  });
  return res.data;
};
