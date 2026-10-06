"use client";

import { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import { HomeSection } from "@/components/ui/home-section";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { RemoteStatus, statusFromError } from "@/hooks/useRemoteData";
import { HOME_SECTION_SIZE } from "@/lib/homeSections";
import type { Product } from "@/types/product";
import { ProductGrid, hasProductContent } from "./ProductGrid";

const PAGE_SIZE = HOME_SECTION_SIZE.justForYou;

const fetchPage = (page: number) =>
  productService.getProducts(undefined, undefined, page, PAGE_SIZE).then((res) => res.data);

export function JustForYou() {
  const { config } = useStoreConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<RemoteStatus>("loading");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPage(0)
      .then((result) => {
        if (!active) return;
        setProducts(result.content);
        setHasMore(!result.last);
        setStatus("success");
      })
      .catch((err) => active && setStatus(statusFromError(err)));
    return () => {
      active = false;
    };
  }, []);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const result = await fetchPage(page + 1);
      setProducts((prev) => [...prev, ...result.content]);
      setHasMore(!result.last);
      setPage(page + 1);
    } catch (err) {
      console.warn("Failed to load more products", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!hasProductContent(status, products)) return null;

  return (
    <HomeSection
      title={config?.justForYouSectionTitle || "Just For You"}
      description={config?.justForYouSectionDesc || "Discover all our premium organic products carefully selected for you."}
      className="py-16 bg-white dark:bg-zinc-950"
    >
      <ProductGrid status={status} products={products} size={PAGE_SIZE} />

      {status === "success" && hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-8 py-3 rounded-full border border-zinc-200 text-sm font-bold text-zinc-700 hover:border-[#5c8b29] hover:text-[#5c8b29] transition-colors cursor-pointer disabled:opacity-60"
          >
            {isLoadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </HomeSection>
  );
}
