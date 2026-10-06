import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import type { RemoteStatus } from "@/hooks/useRemoteData";
import type { Product } from "@/types/product";

interface ProductGridProps {
  status: RemoteStatus;
  products: Product[];
  /** Number of skeleton cards while loading */
  size: number;
}

/** 5-column product grid: skeletons while loading, then real products. */
export function ProductGrid({ status, products, size }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
      {status === "loading" &&
        Array.from({ length: size }, (_, i) => <ProductCardSkeleton key={i} />)}

      {status === "success" && products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

/** Whether a product section has anything to render (hidden when there's nothing, or the server is unreachable). */
export function hasProductContent(status: RemoteStatus, products: Product[]) {
  return status === "loading" || (status === "success" && products.length > 0);
}
