import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { QuantityAdjuster } from "@/components/shop/QuantityAdjuster";
import { StarBadge } from "@/components/ui/star-display";
import { getPrimaryImage, getCurrentPrice, getCategoryName, getProductName } from "@/lib/product";
import { resolveMediaUrl } from "@/lib/api";

interface ProductCardProps {
  product: any;
  /** Offline placeholder: rendered without link or cart actions */
  isPlaceholder?: boolean;
}

export function ProductCard({ product, isPlaceholder = false }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

  const cartItem = cartItems.find((item) => item.id === String(product.id));

  const primaryImage = resolveMediaUrl(getPrimaryImage(product));

  const originalPrice = product.originalPrice ?? product.sellingPrice;
  const currentPrice = getCurrentPrice(product);
  const isSale = originalPrice && originalPrice > currentPrice;

  const categoryName = getCategoryName(product, "Raspollob");

  const ratingValue = Number(product.averageRating || product.rating || 5.0).toFixed(1);
  const reviewsCount = product.reviewCount || product.reviewsCount || 0;
  const isOutOfStock = product.inStock === false || product.stockQuantity === 0;

  const card = (
    <Card className="bg-white border border-zinc-100 shadow-sm rounded-2xl h-full flex flex-col group hover:shadow-md transition-shadow overflow-hidden p-0 gap-0">
      {/* Image Area */}
      <div className="w-full bg-zinc-50 relative aspect-[4/3] flex items-center justify-center overflow-hidden">
        {isSale && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
            SALE
          </div>
        )}
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={getProductName(product)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-16 h-16 bg-zinc-200 rounded-lg group-hover:scale-105 transition-transform duration-300 flex items-center justify-center text-zinc-400 font-bold text-xs">
            Raspollob
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-grow items-center text-center p-3 px-4">
        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">{categoryName}</span>
        <h3 className="text-[14px] font-serif font-bold text-zinc-900 leading-snug mb-1.5 line-clamp-2">
          {product.name}
        </h3>
        {product.sizeLabel && (
          <span className="mb-1.5 px-2 py-0.5 rounded-full bg-[#5c8b29]/10 text-[#4a7021] text-[11px] font-bold">
            {product.sizeLabel}
          </span>
        )}

        <StarBadge rating={ratingValue} reviewCount={reviewsCount} />

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[15px] font-bold text-zinc-900">Tk {Number(currentPrice).toFixed(2)}</span>
          {isSale && (
            <span className="text-[11px] text-zinc-400 line-through">Tk {Number(originalPrice).toFixed(2)}</span>
          )}
        </div>

        <div
          className="w-full mt-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {cartItem && !isPlaceholder ? (
            <QuantityAdjuster
              quantity={cartItem.quantity}
              onDecrease={() =>
                cartItem.quantity > 1
                  ? updateQuantity(product.id, cartItem.quantity - 1)
                  : removeFromCart(product.id)
              }
              onIncrease={() => updateQuantity(product.id, cartItem.quantity + 1)}
            />
          ) : (
            <button
              className="w-full h-[34px] rounded-full border border-zinc-300 text-xs font-bold text-zinc-800 hover:bg-[#5c8b29] hover:border-[#5c8b29] hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => addToCart(product, 1)}
              disabled={isPlaceholder || isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );

  if (isPlaceholder) {
    return <div className="block h-full">{card}</div>;
  }

  return (
    <Link
      href={`/product/${product.slug || product.id}`}
      className="block h-full transition-transform hover:-translate-y-1 duration-300"
    >
      {card}
    </Link>
  );
}

/** Loading state matching ProductCard's layout. */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden h-full flex flex-col">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col items-center gap-2 p-3 px-4">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-[34px] w-full rounded-full mt-1" />
      </div>
    </div>
  );
}
