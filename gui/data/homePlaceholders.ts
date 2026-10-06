import type { Category } from "@/services/categoryService";
import type { CustomerReview } from "@/services/configService";
import type { Product } from "@/types/product";

/**
 * Placeholder content for the storefront home page.
 *
 * Shown ONLY when the API server cannot be reached (e.g. working on the
 * frontend without the backend running). As soon as the server responds,
 * sections render real data — and hide themselves when that data is empty.
 * Never use these to fill gaps in real data.
 */

/** How many items each home section shows. */
export const HOME_SECTION_SIZE = {
  heroSlides: 3,
  categories: 8,
  trending: 5, // one row
  justForYou: 10, // two rows
  reviews: 6,
} as const;

export const PLACEHOLDER_CATEGORY: Category = {
  id: -1,
  name: "Natural Honey",
  slug: "natural-honey",
  displayOrder: 0,
  showInNavbar: false,
  showInHome: true,
  isActive: true,
};

export const PLACEHOLDER_PRODUCT: Product = {
  id: -1,
  name: "Premium Raw Honey (500g)",
  sellingPrice: 1050,
  offerPrice: 850,
  stockQuantity: 50,
  averageRating: 4.9,
  reviewCount: 124,
  category: { name: "Natural Honey" },
};

export const PLACEHOLDER_REVIEW: CustomerReview = {
  name: "Md Bahar Uddin",
  rating: 5,
  comment:
    "Absolutely fantastic quality! The honey is pure and the taste is incredible. Will definitely be ordering again.",
};

/** `count` copies of `item`; items with an `id` get unique negative ids. */
export function repeatPlaceholder<T extends object>(item: T, count: number): T[] {
  return Array.from({ length: count }, (_, i) => ("id" in item ? { ...item, id: -(i + 1) } : { ...item }));
}
