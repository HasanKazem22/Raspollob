"use client";

import { useState } from "react";
import Link from "next/link";
import { LuLayers } from "react-icons/lu";
import { categoryService, Category } from "@/services/categoryService";
import { resolveMediaUrl } from "@/lib/api";
import { HomeSection } from "@/components/ui/home-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useRemoteData } from "@/hooks/useRemoteData";
import { HOME_SECTION_SIZE, PLACEHOLDER_CATEGORY, repeatPlaceholder } from "@/data/homePlaceholders";

const fetchHomeCategories = () => categoryService.getHomeCategories().then((res) => res.data ?? []);

const GRID = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4";

function CategoryTile({ category }: { category: Category }) {
  const previewUrl = category.imageUrl ? resolveMediaUrl(category.imageUrl) : "";
  return (
    <>
      <div className="w-full aspect-square rounded-2xl bg-white border border-zinc-200/80 p-2 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:border-[#5c8b29]/40 group-hover:scale-102">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={category.name}
            className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-108"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <LuLayers className="w-6 h-6" />
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-zinc-700 text-center line-clamp-1 w-full px-1 group-hover:text-[#5c8b29] transition-colors">
        {category.name}
      </span>
    </>
  );
}

export function ShopByCategory() {
  const { config } = useStoreConfig();
  const { status, data: categories = [] } = useRemoteData(fetchHomeCategories);
  const [showAll, setShowAll] = useState(false);

  if (status === "error" || (status === "success" && categories.length === 0)) return null;

  const limit = HOME_SECTION_SIZE.categories;
  const visible = showAll ? categories : categories.slice(0, limit);

  return (
    <HomeSection
      title={config?.categorySectionTitle || "Shop by Category"}
      description={config?.categorySectionDesc || "Discover our farm-fresh, 100% pure organic goods sorted by category."}
      className="pt-8 pb-16 bg-[#FDFBF9]"
    >
      <div className={GRID}>
        {status === "loading" &&
          Array.from({ length: limit }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5">
              <Skeleton className="w-full aspect-square rounded-2xl" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}

        {status === "offline" &&
          repeatPlaceholder(PLACEHOLDER_CATEGORY, limit).map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-2.5 group">
              <CategoryTile category={cat} />
            </div>
          ))}

        {status === "success" &&
          visible.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className="flex flex-col items-center gap-2.5 group cursor-pointer"
            >
              <CategoryTile category={cat} />
            </Link>
          ))}
      </div>

      {status === "success" && categories.length > limit && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2.5 rounded-full border border-zinc-200 text-sm font-bold text-zinc-700 hover:border-[#5c8b29] hover:text-[#5c8b29] transition-colors cursor-pointer"
          >
            {showAll ? "Show Less" : "Show More Categories"}
          </button>
        </div>
      )}
    </HomeSection>
  );
}
