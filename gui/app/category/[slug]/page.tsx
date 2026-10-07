"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { categoryService, type Category } from "@/services/categoryService";
import { useRemoteData } from "@/hooks/useRemoteData";
import { ApiError } from "@/lib/api";
import { ProductBrowser, PRODUCT_GRID, SHOP_CONTAINER } from "@/components/shop/ProductBrowser";
import { ProductCardSkeleton } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";

const fetchAllCategories = () => categoryService.getCategories().then((res) => res.data ?? []);

/** Quick links to the other categories. */
function CategoryChips({ current }: { current: Category }) {
  const { status, data: categories = [] } = useRemoteData(fetchAllCategories);
  if (status !== "success" || categories.length < 2) return null;
  return (
    <nav aria-label="Categories" className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-1 px-1">
      {categories.map((cat) => {
        const active = cat.id === current.id;
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 h-8 px-3.5 rounded-full border text-xs font-semibold inline-flex items-center transition-colors ${
              active
                ? "bg-brand border-brand text-white"
                : "bg-white border-zinc-200 text-zinc-600 hover:border-brand hover:text-brand"
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}

function CategoryNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-2xl font-serif font-bold mb-4">Category Not Found</h1>
      <p className="text-zinc-500 mb-8">This category doesn&apos;t exist or is no longer available.</p>
      <Link
        href="/"
        className="bg-brand hover:bg-brand-hover text-white font-bold py-3 px-8 rounded-full transition-colors"
      >
        Back to Shop
      </Link>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const fetchCategory = useCallback(() => categoryService.getCategory(slug).then((res) => res.data), [slug]);
  const { status, data: category, error, reload } = useRemoteData(fetchCategory);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className={`${SHOP_CONTAINER} pt-5 pb-5 space-y-2`}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className={`${SHOP_CONTAINER} ${PRODUCT_GRID}`}>
          {Array.from({ length: 10 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (status === "error" && error instanceof ApiError && error.status === 404) {
    return <CategoryNotFound />;
  }
  if (status !== "success" || !category) {
    return (
      <div className="min-h-[60vh] bg-background py-12">
        <ServerErrorCard error={error} onRetry={reload} title="Couldn't Load Category" />
      </div>
    );
  }

  return (
    <ProductBrowser
      // Fresh search and sort per category
      key={category.id}
      categoryId={category.id}
      breadcrumb={
        <>
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-600">{category.name}</span>
        </>
      }
      title={category.name}
      description={category.description}
      below={<CategoryChips current={category} />}
      searchPlaceholder={`Search in ${category.name}`}
      emptyTitle="No products here yet"
      emptyDescription="New products are on their way. Check back soon or explore our other categories."
    />
  );
}
