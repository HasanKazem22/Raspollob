"use client";

import { productService } from "@/services/productService";
import { HomeSection } from "@/components/ui/home-section";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useRemoteData } from "@/hooks/useRemoteData";
import { HOME_SECTION_SIZE } from "@/data/homePlaceholders";
import { ProductGrid, hasProductContent } from "./ProductGrid";

const fetchTrending = () =>
  productService.getTrendingProducts(HOME_SECTION_SIZE.trending).then((res) => res.data ?? []);

export function TrendingProducts() {
  const { config } = useStoreConfig();
  const { status, data: products = [] } = useRemoteData(fetchTrending);

  if (!hasProductContent(status, products)) return null;

  return (
    <HomeSection
      title={config?.trendingSectionTitle || "Trending Products"}
      description={
        config?.trendingSectionDesc ||
        "Our most popular pure, organic honey and cold-pressed items loved by customers."
      }
      className="py-16 bg-[#FDFBF9]"
    >
      <ProductGrid status={status} products={products} size={HOME_SECTION_SIZE.trending} />
    </HomeSection>
  );
}
