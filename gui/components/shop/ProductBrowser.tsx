"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuLoader, LuPackageOpen, LuSearch, LuSearchX, LuX } from "react-icons/lu";
import { productService, type ProductSortField } from "@/services/productService";
import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { Dropdown } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { NoData } from "@/components/ui/no-data";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import type { Product } from "@/types/product";

export const SHOP_CONTAINER = "container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl";
export const PRODUCT_GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5";
const PAGE_SIZE = 20;

const SORT_OPTIONS: { value: string; label: string; sortBy: ProductSortField; sortDir: "ASC" | "DESC" }[] = [
  { value: "newest", label: "Newest first", sortBy: "createdAt", sortDir: "DESC" },
  { value: "price-asc", label: "Price: low to high", sortBy: "price", sortDir: "ASC" },
  { value: "price-desc", label: "Price: high to low", sortBy: "price", sortDir: "DESC" },
  { value: "rating", label: "Top rated", sortBy: "rating", sortDir: "DESC" },
  { value: "name", label: "Name: A to Z", sortBy: "name", sortDir: "ASC" },
];

/** Value that only updates after the user stops typing. */
export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface Listing {
  /** Which filters these results belong to */
  key: string;
  query: string;
  items: Product[];
  page: number;
  last: boolean;
  total: number;
}

interface ProductBrowserProps {
  /** Small trail above the title, e.g. Home / Honey */
  breadcrumb: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional row under the header (category chips) */
  below?: React.ReactNode;
  /** Limit to one category; omit to search the whole store */
  categoryId?: number;
  searchPlaceholder: string;
  /** Starting search text (e.g. from ?q=) */
  initialQuery?: string;
  /** Called with the debounced search text, e.g. to keep it in the URL */
  onQueryChange?: (query: string) => void;
  /** Shown when there's nothing to list and no search text */
  emptyTitle: string;
  emptyDescription: string;
  /** Search page only: show a prompt instead of everything until something is typed */
  requireQuery?: boolean;
}

/**
 * Header + search + sort + product grid with "Load more", shared by the category and search pages.
 * Old results stay on screen (dimmed) while new ones load, so nothing flickers.
 */
export function ProductBrowser({
  breadcrumb,
  title,
  description,
  below,
  categoryId,
  searchPlaceholder,
  initialQuery = "",
  onQueryChange,
  emptyTitle,
  emptyDescription,
  requireQuery = false,
}: ProductBrowserProps) {
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);
  const [search, setSearch] = useState(initialQuery);
  const query = useDebounced(search.trim(), 300);
  const sort = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];

  const [listing, setListing] = useState<Listing | null>(null);
  const [listError, setListError] = useState<{ key: string; error: unknown } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const waitingForQuery = requireQuery && !query;
  const listKey = `${categoryId ?? "all"}|${sort.value}|${query}`;
  const latestKey = useRef(listKey);
  useEffect(() => {
    latestKey.current = listKey;
  }, [listKey]);

  const onQueryChangeRef = useRef(onQueryChange);
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  });
  useEffect(() => {
    onQueryChangeRef.current?.(query);
  }, [query]);

  // First page whenever the category, sort or search changes
  useEffect(() => {
    if (waitingForQuery) return;
    const key = `${categoryId ?? "all"}|${sort.value}|${query}`;
    let active = true;
    productService
      .getProducts(query || undefined, categoryId, 0, PAGE_SIZE, { sortBy: sort.sortBy, sortDir: sort.sortDir })
      .then((res) => {
        if (!active) return;
        const page = res.data;
        setListing({ key, query, items: page.content, page: 0, last: page.last, total: page.totalElements });
        setListError(null);
      })
      .catch((error) => {
        if (active) setListError({ key, error });
      });
    return () => {
      active = false;
    };
  }, [categoryId, sort.value, sort.sortBy, sort.sortDir, query, attempt, waitingForQuery]);

  const loadMore = async () => {
    if (!listing || listing.last) return;
    const key = listing.key;
    setLoadingMore(true);
    try {
      const res = await productService.getProducts(query || undefined, categoryId, listing.page + 1, PAGE_SIZE, {
        sortBy: sort.sortBy,
        sortDir: sort.sortDir,
      });
      if (latestKey.current !== key) return; // filters changed meanwhile
      const page = res.data;
      setListing((prev) =>
        prev && prev.key === key
          ? {
              ...prev,
              // Skip anything already shown (new products may shift pages)
              items: [...prev.items, ...page.content.filter((p) => !prev.items.some((i) => i.id === p.id))],
              page: prev.page + 1,
              last: page.last,
              total: page.totalElements,
            }
          : prev
      );
    } catch {
      // The button stays, so the customer can simply try again
    } finally {
      setLoadingMore(false);
    }
  };

  const isRefreshing = !!listing && listing.key !== listKey && !waitingForQuery;
  const failedNow = listError?.key === listKey;
  const shown = waitingForQuery ? [] : listing?.items ?? [];

  const controls = (
    <div className="flex items-center gap-2.5 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-64">
        <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" aria-hidden />
        <input
          id="product-browser-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          autoComplete="off"
          className="w-full h-10 pl-10 pr-9 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
          >
            <LuX className="w-4 h-4" />
          </button>
        )}
      </div>
      <Dropdown
        options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
        value={sortValue}
        onChange={setSortValue}
        className="w-44 shrink-0"
      />
    </div>
  );

  const count = waitingForQuery ? null : listing ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500" aria-live="polite">
      {listing.total} {listing.total === 1 ? "product" : "products"}
      {isRefreshing && <LuLoader className="w-3.5 h-3.5 animate-spin text-zinc-400" aria-label="Updating" />}
    </span>
  ) : (
    <Skeleton className="h-4 w-20" />
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Compact header: title, count, search and sort on one line */}
      <div className={`${SHOP_CONTAINER} pt-5 pb-5`}>
        <nav className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-2">{breadcrumb}</nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 leading-tight">{title}</h1>
              {count}
            </div>
            {description && <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{description}</p>}
          </div>
          {controls}
        </div>
        {below}
      </div>

      <div className={SHOP_CONTAINER}>
        {waitingForQuery ? (
          <NoData
            icon={LuSearch}
            title="What are you looking for?"
            description="Type a product name, such as honey or mustard oil."
          />
        ) : failedNow && !listing ? (
          <ServerErrorCard
            error={listError.error}
            onRetry={() => {
              setListError(null);
              setAttempt((n) => n + 1);
            }}
            title="Couldn't Load Products"
            variant="inline"
          />
        ) : !listing ? (
          <div className={PRODUCT_GRID}>
            {Array.from({ length: 10 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : shown.length === 0 && !isRefreshing ? (
          listing.query ? (
            <NoData
              icon={LuSearchX}
              title={`No products match “${listing.query}”`}
              description="Check the spelling or try a shorter word."
              action={
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 h-9 px-4 rounded-full border border-zinc-300 text-sm font-semibold text-zinc-800 hover:border-brand hover:text-brand cursor-pointer"
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <NoData
              icon={LuPackageOpen}
              title={emptyTitle}
              description={emptyDescription}
              action={
                <Link
                  href="/"
                  className="mt-4 inline-flex h-9 px-4 items-center rounded-full bg-brand hover:bg-brand-hover text-white text-sm font-bold"
                >
                  Back to Shop
                </Link>
              }
            />
          )
        ) : (
          <>
            <div
              aria-busy={isRefreshing}
              className={`${PRODUCT_GRID} transition-opacity duration-200 ${isRefreshing ? "opacity-50" : ""}`}
            >
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {!listing.last && !isRefreshing && (
              <div className="flex flex-col items-center gap-2 mt-10">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-11 px-8 rounded-full border border-zinc-300 bg-white text-sm font-bold text-zinc-800 hover:border-brand hover:text-brand transition-colors disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
                >
                  {loadingMore && <LuLoader className="w-4 h-4 animate-spin" />}
                  Load more products
                </button>
                <span className="text-xs text-zinc-400">
                  Showing {shown.length} of {listing.total}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
