"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LuStar, LuMinus, LuPlus, LuLoader } from "react-icons/lu";
import { toast } from "react-hot-toast";
import { productService } from "@/services/productService";
import { useCart } from "@/context/CartContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useRemoteData } from "@/hooks/useRemoteData";
import { ApiError, resolveMediaUrl } from "@/lib/api";
import { getCategoryName, getCurrentPrice, getProductName, pricePer100 } from "@/lib/product";
import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import type { Product, ProductSizeOption } from "@/types/product";

const CONTAINER = "container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl";
const DEFAULT_SHIPPING_TEXT =
  "We offer nationwide delivery within 2-4 business days. Free shipping on orders over Tk 2000. For returns, please contact our support within 7 days of receiving your item.";

type DetailTab = "details" | "ingredients" | "shipping";

/** Gallery images, cover first, then by display order. */
function getGallery(product: Product): string[] {
  const images = [...(product.images ?? [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayOrder - b.displayOrder)
    .map((img) => img.imageUrl);
  if (images.length === 0 && (product.primaryImageUrl || product.imageUrl)) {
    images.push((product.primaryImageUrl || product.imageUrl)!);
  }
  return images;
}

const RELATED_COUNT = 5;

/**
 * Other products from the same category first (never other sizes of this one; they're in the size
 * picker), topped up with the newest products from the rest of the store when the category is small.
 */
function RelatedProducts({ categoryId, current }: { categoryId?: number; current: Product }) {
  const currentId = current.id;
  const family = current.variantGroup;
  const fetchRelated = useCallback(async () => {
    const [sameCategory, newest] = await Promise.all([
      categoryId
        ? productService.getProducts(undefined, categoryId, 0, 12).then((res) => res.data.content)
        : Promise.resolve([] as Product[]),
      productService.getProducts(undefined, undefined, 0, 12).then((res) => res.data.content),
    ]);
    const seen = new Set<number | undefined>([currentId]);
    const picked: Product[] = [];
    for (const p of [...sameCategory, ...newest]) {
      if (seen.has(p.id) || (family && p.variantGroup === family)) continue;
      seen.add(p.id);
      picked.push(p);
      if (picked.length === RELATED_COUNT) break;
    }
    return picked;
  }, [categoryId, currentId, family]);
  const { status, data: related = [] } = useRemoteData(fetchRelated);

  if (status !== "loading" && related.length === 0) return null;

  return (
    <div className={`${CONTAINER} pt-10 border-t border-zinc-100 mt-10`}>
      <h2 className="text-xl md:text-2xl font-serif font-bold text-zinc-900 mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
        {status === "loading"
          ? Array.from({ length: 5 }, (_, i) => <ProductCardSkeleton key={i} />)
          : related.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

/** Every size is its own product (own photos, price and stock); picking one swaps it in place. */
function SizePicker({
  current,
  sizes,
  pendingId,
  onSelect,
}: {
  current: Product;
  sizes: ProductSizeOption[];
  /** Size being loaded right now (only when it wasn't prefetched yet) */
  pendingId: number | null;
  onSelect: (id: number) => void;
}) {
  if (!current.sizeLabel) return null;
  const selectedId = pendingId ?? current.id;
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-zinc-900 mb-2.5">
        Size: <span className="font-bold">{sizes.find((s) => s.id === selectedId)?.sizeLabel ?? current.sizeLabel}</span>
      </p>
      {sizes.length > 1 && (
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Size">
          {sizes.map((size) => {
            const selected = size.id === selectedId;
            const price = Number(size.offerPrice ?? size.sellingPrice);
            return (
              <button
                key={size.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(size.id)}
                className={`relative min-w-[92px] rounded-xl border-2 px-4 py-2.5 text-center transition-colors cursor-pointer ${
                  selected ? "border-brand bg-brand/5" : "border-zinc-200 bg-white hover:border-zinc-300"
                } ${size.inStock ? "" : "opacity-50"}`}
              >
                <span className={`block text-sm font-bold ${selected ? "text-brand-strong" : "text-zinc-900"}`}>
                  {size.sizeLabel}
                </span>
                <span className="block text-xs text-zinc-500 mt-0.5">
                  {size.inStock ? `Tk ${price.toFixed(0)}` : "Out of stock"}
                </span>
                {size.id === pendingId && (
                  <LuLoader className="absolute top-1.5 right-1.5 w-3 h-3 animate-spin text-brand" aria-label="Loading" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className={`${CONTAINER} py-6`}>
      <Skeleton className="h-3 w-56 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 lg:gap-12">
        <div className="space-y-4">
          <Skeleton className="w-full max-w-[480px] aspect-square rounded-2xl" />
          <div className="grid grid-cols-5 gap-2.5 max-w-[480px]">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-2xl font-serif font-bold mb-4">Product Not Found</h1>
      <p className="text-zinc-500 mb-8">The product you are looking for does not exist or is no longer available.</p>
      <Link
        href="/"
        className="bg-brand hover:bg-brand-hover text-white font-bold py-3 px-8 rounded-full transition-colors"
      >
        Back to Shop
      </Link>
    </div>
  );
}

const fetchProduct = (id: string | number) => productService.getProductById(id).then((res) => res.data);

export default function ProductDetailsPage() {
  const { id: routeId } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { config } = useStoreConfig();

  // The size on screen. Picking a size changes it in place (no page navigation);
  // following a link to another product changes the route id, which takes over again.
  const [currentId, setCurrentId] = useState(routeId);
  const [lastRouteId, setLastRouteId] = useState(routeId);
  if (routeId !== lastRouteId) {
    setLastRouteId(routeId);
    setCurrentId(routeId);
  }

  // Loaded products by id: sizes are prefetched, so switching is usually instant
  const [cache, setCache] = useState<Record<string, Product>>({});
  const [failure, setFailure] = useState<{ id: string; error: unknown } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // A picked size that wasn't prefetched yet: the current size stays on screen until it arrives
  const [pendingSizeId, setPendingSizeId] = useState<number | null>(null);
  const latestPick = useRef<number | null>(null);

  const product = cache[currentId];

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("details");

  // New size or product: back to the first photo and quantity 1
  const [viewFor, setViewFor] = useState<number | undefined>(undefined);
  if (product?.id !== viewFor) {
    setViewFor(product?.id);
    setActiveImage(0);
    setQuantity(1);
  }

  // Load the product from the address (first visit, or a link to another product)
  useEffect(() => {
    if (cache[currentId]) return;
    let active = true;
    fetchProduct(currentId)
      .then((p) => {
        if (!active) return;
        setCache((prev) => ({ ...prev, [currentId]: p }));
        setFailure(null);
      })
      .catch((error) => {
        if (active) setFailure({ id: currentId, error });
      });
    return () => {
      active = false;
    };
  }, [currentId, cache, attempt]);

  // Prefetch the other sizes (data and cover photo) so picking one needs no wait
  const sizeIds = (product?.sizes ?? []).map((s) => String(s.id)).join(",");
  useEffect(() => {
    if (!sizeIds) return;
    let active = true;
    for (const id of sizeIds.split(",")) {
      fetchProduct(id)
        .then((p) => {
          if (!active) return;
          setCache((prev) => (prev[id] ? prev : { ...prev, [id]: p }));
          const cover = p.primaryImageUrl || p.images?.[0]?.imageUrl;
          if (cover) new Image().src = resolveMediaUrl(cover);
        })
        .catch(() => {
          // a failed prefetch just means that size loads when picked
        });
    }
    return () => {
      active = false;
    };
  }, [sizeIds]);

  const showSize = (id: number) => {
    setCurrentId(String(id));
    // Keep the address shareable without a page navigation
    window.history.replaceState(window.history.state, "", `/product/${id}`);
  };

  const selectSize = (id: number) => {
    if (String(id) === currentId) return;
    latestPick.current = id;
    if (cache[String(id)]) {
      setPendingSizeId(null);
      showSize(id);
      return;
    }
    setPendingSizeId(id);
    fetchProduct(id)
      .then((p) => {
        setCache((prev) => ({ ...prev, [String(id)]: p }));
        if (latestPick.current !== id) return; // another size was picked meanwhile
        setPendingSizeId(null);
        showSize(id);
      })
      .catch(() => {
        if (latestPick.current !== id) return;
        setPendingSizeId(null);
        toast.error("Couldn't load that size. Please try again.");
      });
  };

  if (!product) {
    const failedHere = failure?.id === currentId;
    if (failedHere && failure.error instanceof ApiError && failure.error.status === 404) {
      return <ProductNotFound />;
    }
    if (failedHere) {
      return (
        <div className="min-h-[60vh] bg-background py-12">
          <ServerErrorCard
            error={failure.error}
            onRetry={() => {
              setFailure(null);
              setAttempt((n) => n + 1);
            }}
            title="Couldn't Load Product"
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background pb-20">
        <ProductDetailsSkeleton />
      </div>
    );
  }

  const gallery = getGallery(product);
  const currentPrice = Number(getCurrentPrice(product));
  const regularPrice = Number(product.sellingPrice ?? 0);
  const isSale = regularPrice > currentPrice;
  const unitPrice = pricePer100(product.sizeLabel, currentPrice);
  const rating = Number(product.averageRating ?? 0);
  const stock = product.stockQuantity ?? 0;
  const isOutOfStock = product.inStock === false || stock <= 0;
  const categoryName = getCategoryName(product);
  const categoryId = typeof product.category === "object" ? product.category?.id : product.categoryId;
  const categorySlug = typeof product.category === "object" ? product.category?.slug : undefined;

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "details", label: "Details" },
    ...(product.ingredients ? [{ id: "ingredients" as const, label: "Ingredients" }] : []),
    { id: "shipping", label: "Shipping" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Breadcrumb */}
      <div className={`${CONTAINER} pt-5 pb-2`}>
        <nav className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 min-w-0">
          <Link href="/" className="hover:text-brand transition-colors">Home</Link>
          {categoryName && (
            <>
              <span>/</span>
              <Link href={categorySlug ? `/category/${categorySlug}` : "/"} className="hover:text-brand transition-colors">
                {categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-600 truncate">{getProductName(product)}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <div className={`${CONTAINER} py-4`}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 lg:gap-12 items-start">
          {/* Left: Image Gallery (stays in view while scrolling the details) */}
          <div className="flex flex-col gap-2.5 w-full max-w-[480px] mx-auto lg:mx-0 lg:sticky lg:top-24">
            <div className="w-full aspect-square bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 relative overflow-hidden">
              {isSale && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                  SALE
                </div>
              )}
              {gallery[activeImage] ? (
                <img
                  src={resolveMediaUrl(gallery[activeImage])}
                  alt={getProductName(product)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-zinc-200 rounded-2xl" />
              )}
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5">
                {gallery.map((url, i) => (
                  <button
                    key={url + i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all bg-zinc-50 cursor-pointer ${
                      i === activeImage ? "border-brand" : "border-transparent hover:border-zinc-200"
                    }`}
                  >
                    <img src={resolveMediaUrl(url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
              {categoryName || "Raspollob"}
            </span>
            <h1 className="text-2xl lg:text-[28px] font-serif font-bold text-zinc-900 leading-snug mb-3 text-balance">{product.name}</h1>

            {/* Reviews */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <LuStar key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-amber-400" : "text-zinc-300"}`} />
                ))}
              </div>
              <span className="text-xs font-medium text-zinc-500">
                {rating.toFixed(1)} ({product.reviewCount ?? 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 mb-6">
              <span className="text-2xl font-bold text-zinc-900">Tk {currentPrice.toFixed(2)}</span>
              {isSale && <span className="text-base text-zinc-400 line-through">Tk {regularPrice.toFixed(2)}</span>}
              {unitPrice && <span className="text-xs text-zinc-500">({unitPrice})</span>}
            </div>

            <SizePicker
              current={product}
              sizes={product.sizes ?? []}
              pendingId={pendingSizeId}
              onSelect={selectSize}
            />

            {product.description && (
              <p className="text-sm text-zinc-600 leading-relaxed mb-6">{product.description}</p>
            )}

            <hr className="border-zinc-100 mb-6" />

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center justify-between border border-zinc-200 rounded-full px-4 py-2.5 sm:w-32 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                  aria-label="Decrease quantity"
                  className="text-zinc-400 hover:text-brand transition-colors disabled:opacity-40"
                >
                  <LuMinus className="w-4 h-4" />
                </button>
                <span className="font-bold text-zinc-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={isOutOfStock || quantity >= stock}
                  aria-label="Increase quantity"
                  className="text-zinc-400 hover:text-brand transition-colors disabled:opacity-40"
                >
                  <LuPlus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => addToCart(product, quantity)}
                disabled={isOutOfStock}
                className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm font-bold py-3 px-8 rounded-full shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-col">
              <div className="flex items-center gap-8 border-b border-zinc-200 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 text-sm font-bold transition-colors relative ${
                      activeTab === tab.id ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand" />}
                  </button>
                ))}
              </div>

              <div className="text-[14px] text-zinc-600 leading-relaxed min-h-[120px] whitespace-pre-line">
                {activeTab === "details" && <p>{product.details || product.description || "No additional details."}</p>}
                {activeTab === "ingredients" && <p>{product.ingredients}</p>}
                {activeTab === "shipping" && <p>{config?.shippingDeliveryInfo || DEFAULT_SHIPPING_TEXT}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts categoryId={categoryId} current={product} />
    </div>
  );
}
