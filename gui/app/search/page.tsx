"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductBrowser } from "@/components/shop/ProductBrowser";

function SearchResults() {
  const q = useSearchParams().get("q") ?? "";

  // Typing here updates ?q= in place; a new search from the navbar starts the page fresh
  const [ownQuery, setOwnQuery] = useState(q);
  const [seenQuery, setSeenQuery] = useState(q);
  const [browserKey, setBrowserKey] = useState(0);
  if (q !== seenQuery) {
    setSeenQuery(q);
    if (q !== ownQuery) {
      setOwnQuery(q);
      setBrowserKey((k) => k + 1);
    }
  }

  const handleQueryChange = (query: string) => {
    if (query === ownQuery) return;
    setOwnQuery(query);
    const url = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <ProductBrowser
      key={browserKey}
      initialQuery={q}
      onQueryChange={handleQueryChange}
      requireQuery
      breadcrumb={
        <>
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-600">Search</span>
        </>
      }
      title={ownQuery ? <>Results for &ldquo;{ownQuery}&rdquo;</> : "Search"}
      searchPlaceholder="Search all products"
      emptyTitle="No products yet"
      emptyDescription="New products are on their way. Check back soon."
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchResults />
    </Suspense>
  );
}
