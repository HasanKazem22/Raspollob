export type AssetStatus =
  | "FOR_SALE"
  | "FOR_RENT"
  | "NEW_LISTING"
  | "JUST_SOLD"
  | "BOOKED";

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  FOR_SALE: "For Sale",
  FOR_RENT: "For Rent",
  NEW_LISTING: "New Listing",
  JUST_SOLD: "Just Sold",
  BOOKED: "Booked",
};

export interface RealAsset {
  id?: number;
  code?: string;
  title: string;
  location: string;
  price: number;
  imageUrl?: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  status?: AssetStatus;
  description?: string;
  isFeatured?: boolean;
}
