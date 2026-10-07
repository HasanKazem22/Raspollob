"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LuArrowRight, LuLoader, LuSearch, LuX } from "react-icons/lu";
import { productService } from "@/services/productService";
import { useDebounced } from "@/components/shop/ProductBrowser";
import { resolveMediaUrl } from "@/lib/api";
import { getCategoryName, getCurrentPrice, getPrimaryImage, getProductName } from "@/lib/product";
import type { Product } from "@/types/product";

const MIN_CHARS = 2;
const MAX_SUGGESTIONS = 6;

interface Suggestions {
  query: string;
  items: Product[];
  total: number;
}

/**
 * Search box that drops down under the navbar, with live product suggestions.
 * Enter (or "See all results") opens the full results page.
 */
export function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const query = useDebounced(text.trim(), 250);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [failedQuery, setFailedQuery] = useState<string | null>(null);
  // Keyboard highlight: 0..items-1 = a product, items.length = "See all results"
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (query.length < MIN_CHARS) return;
    let active = true;
    productService
      .getProducts(query, undefined, 0, MAX_SUGGESTIONS, { sortBy: "name", sortDir: "ASC" })
      .then((res) => {
        if (!active) return;
        setSuggestions({ query, items: res.data.content, total: res.data.totalElements });
        setFailedQuery(null);
        setHighlight(-1);
      })
      .catch(() => {
        if (active) setFailedQuery(query);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const typed = text.trim();
  const ready = query.length >= MIN_CHARS && suggestions?.query === query;
  const items = ready ? suggestions.items : [];
  const isSearching = typed.length >= MIN_CHARS && (query !== typed || (!ready && failedQuery !== query));

  const openResults = () => {
    if (!typed) return;
    router.push(`/search?q=${encodeURIComponent(typed)}`);
    onClose();
  };

  const openProduct = (product: Product) => {
    router.push(`/product/${product.id}`);
    onClose();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = items.length; // index of "See all results"
    if (e.key === "ArrowDown" && ready) {
      e.preventDefault();
      setHighlight((h) => (h >= last ? 0 : h + 1));
    } else if (e.key === "ArrowUp" && ready) {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? last : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < items.length) openProduct(items[highlight]);
      else openResults();
    }
  };

  return (
    <>
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10 bg-black/20 animate-in fade-in duration-150" onClick={onClose} aria-hidden />

      <div className="absolute left-0 right-0 top-full bg-white border-b border-zinc-200 shadow-lg animate-in slide-in-from-top-2 fade-in duration-150">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              openResults();
            }}
            className="relative"
          >
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" aria-hidden />
            <input
              ref={inputRef}
              id="navbar-search"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search products, e.g. honey"
              aria-label="Search products"
              aria-controls="navbar-search-results"
              aria-activedescendant={highlight >= 0 ? `search-option-${highlight}` : undefined}
              autoComplete="off"
              className="w-full h-12 pl-12 pr-20 rounded-full border border-zinc-200 bg-zinc-50 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/15 [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching && <LuLoader className="w-4 h-4 animate-spin text-zinc-400" aria-label="Searching" />}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Suggestions */}
          {typed.length > 0 && typed.length < MIN_CHARS && (
            <p className="mt-3 px-2 text-xs text-zinc-400">Keep typing…</p>
          )}

          {failedQuery === query && typed.length >= MIN_CHARS && !isSearching && (
            <p className="mt-3 px-2 text-sm text-zinc-500">Search isn&apos;t available right now. Please try again.</p>
          )}

          {ready && (
            <div id="navbar-search-results" role="listbox" className="mt-3">
              {items.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">
                  No products match &ldquo;<span className="text-zinc-900">{suggestions.query}</span>&rdquo;.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {items.map((product, i) => {
                    const image = getPrimaryImage(product);
                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          id={`search-option-${i}`}
                          role="option"
                          aria-selected={highlight === i}
                          onClick={() => openProduct(product)}
                          onMouseEnter={() => setHighlight(i)}
                          className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                            highlight === i ? "bg-zinc-50" : ""
                          }`}
                        >
                          <span className="w-11 h-11 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                            {image && (
                              <img src={resolveMediaUrl(image)} alt="" className="w-full h-full object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-zinc-900 truncate">
                              {getProductName(product)}
                            </span>
                            <span className="block text-xs text-zinc-400 truncate">{getCategoryName(product)}</span>
                          </span>
                          <span className="text-sm font-bold text-zinc-900 shrink-0">
                            Tk {Number(getCurrentPrice(product)).toFixed(0)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <button
                type="button"
                id={`search-option-${items.length}`}
                role="option"
                aria-selected={highlight === items.length}
                onClick={openResults}
                onMouseEnter={() => setHighlight(items.length)}
                className={`mt-2 w-full flex items-center justify-between px-3 h-10 rounded-xl text-sm font-semibold text-brand-strong transition-colors cursor-pointer ${
                  highlight === items.length ? "bg-brand/10" : "hover:bg-brand/10"
                }`}
              >
                <span>
                  See all results for &ldquo;{suggestions.query}&rdquo;
                  {suggestions.total > 0 && <span className="text-zinc-400 font-normal"> · {suggestions.total}</span>}
                </span>
                <LuArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
