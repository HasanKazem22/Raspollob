// Helpers for reading product fields. They accept both full API products and
// lighter shapes (cart snapshots, placeholders), where some fields are missing
// or named differently — these helpers hide that difference.

/** First usable image URL: primaryImageUrl → first gallery image → imageUrl. */
export function getPrimaryImage(product: any): string {
  return (
    product.primaryImageUrl ||
    (Array.isArray(product.images) && product.images.length > 0
      ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.imageUrl)
      : null) ||
    product.imageUrl ||
    ""
  );
}

/** Name to show customers: "Honey 250 g" for a sized item, otherwise the plain name. */
export function getProductName(product: any): string {
  if (product.displayName) return product.displayName;
  return product.sizeLabel ? `${product.name} ${product.sizeLabel}` : product.name;
}

/** Price the customer pays now: offer price if set, otherwise the regular price. */
export function getCurrentPrice(product: any): number {
  return product.offerPrice ?? product.price ?? product.sellingPrice ?? 0;
}

/** Unit price of a cart line. */
export function getLinePrice(item: { price?: number; sellingPrice?: number }): number {
  return Number(item.price || item.sellingPrice || 0);
}

/** Category name whether `category` is an object or a plain string. */
export function getCategoryName(product: any, fallback = ""): string | undefined {
  return typeof product.category === "object"
    ? product.category?.name
    : (product.category || fallback);
}

/** Unit profit and gross margin, using the offer price when one is set. */
export function calcMargin(sellingPrice: number, offerPrice: number | null, buyingPrice: number) {
  const effectivePrice = offerPrice !== null && offerPrice > 0 ? offerPrice : sellingPrice;
  const profit = effectivePrice - buyingPrice;
  const margin = effectivePrice > 0 ? ((profit / effectivePrice) * 100).toFixed(1) : "0.0";
  return { profit, margin, isProfit: profit >= 0 };
}

const PER_100: Record<string, { base: number; unit: string }> = {
  g: { base: 1, unit: "100 g" },
  kg: { base: 1000, unit: "100 g" },
  ml: { base: 1, unit: "100 ml" },
  l: { base: 1000, unit: "100 ml" },
};

/** "Tk 140.00 / 100 g" for weight/volume sizes, so bigger packs show their value; null otherwise. */
export function pricePer100(sizeLabel: string | null | undefined, price: number): string | null {
  const match = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)$/i.exec(sizeLabel?.trim() ?? "");
  if (!match || !(price > 0)) return null;
  const unit = PER_100[match[2].toLowerCase()];
  const amount = Number(match[1]) * unit.base;
  if (!(amount > 0)) return null;
  return `Tk ${((price / amount) * 100).toFixed(2)} / ${unit.unit}`;
}
