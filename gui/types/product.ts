export interface ProductImage {
  id?: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  altText?: string;
}

export interface CategoryInfo {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

/** One size of an item (e.g. "500 g"); every size is its own product with its own page. */
export interface ProductSizeOption {
  id: number;
  sizeLabel: string | null;
  sellingPrice: number;
  offerPrice?: number | null;
  inStock: boolean;
  primaryImageUrl?: string | null;
  /** Admin responses only */
  isActive?: boolean | null;
  /** Admin responses only */
  stockQuantity?: number | null;
}

export interface Product {
  id?: number;
  sku?: string;
  name: string;
  /** Pack size, e.g. "250 g"; empty for items sold in one size */
  sizeLabel?: string | null;
  /** name + size, e.g. "Honey 250 g" */
  displayName?: string;
  /** Shared by all sizes of one item */
  variantGroup?: string | null;
  /** All sizes of this item, smallest first (single-product responses only) */
  sizes?: ProductSizeOption[];
  slug?: string;
  price?: number;
  sellingPrice?: number;
  originalPrice?: number | null;
  buyingPrice?: number | null;
  offerPrice?: number | null;
  discountPercentage?: number | null;
  imageUrl?: string;
  primaryImageUrl?: string;
  images?: ProductImage[];
  brandLogo?: string;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  category?: CategoryInfo | string;
  categoryId?: number;
  stockQuantity: number;
  inStock?: boolean;
  salesCount?: number;
  isTrending?: boolean;
  isAvailable?: boolean;
  isActive?: boolean;
  description?: string;
  details?: string;
  ingredients?: string;
}

/**
 * Global form state for creating or editing products
 */
export interface ProductFormValues {
  id?: number;
  name: string;
  sku: string;
  sizeLabel: string;
  /** "Same product as": a product to link sizes with, "" when not linked */
  sizeOf: number | "";
  categoryId: number | "";
  sellingPrice: number | "";
  buyingPrice: number | "";
  offerPrice: number | "";
  stockQuantity: number | "";
  isTrending: boolean;
  isActive: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
  description: string;
  details: string;
  ingredients: string;
  images: ProductImage[];
}

