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
  /** Brand colour "#RRGGBB" for the whole site (design token --brand); empty = default green */
  primaryColor?: string;
  /** No longer used: the site has one brand colour */
  secondaryColor?: string;
  /** Text under the logo in the site footer */
  footerDescription?: string | null;
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

  // Welcome offer popup
  offerEnabled?: boolean;
  offerImage?: string | null;
  offerTitle?: string | null;
  offerText?: string | null;
  offerPromoCode?: string | null;
  offerButtonText?: string | null;
  /** Same-site path ("/category/honey") or https:// URL */
  offerButtonLink?: string | null;
  /** "YYYY-MM-DDTHH:mm" store-local time; empty = no limit */
  offerStartsAt?: string | null;
  offerEndsAt?: string | null;
  /** Worked out by the server: enabled, has an image, and inside its dates */
  offerActive?: boolean;
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
