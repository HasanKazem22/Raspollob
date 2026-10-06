"use client";

import { Tooltip } from "@/components/ui/tooltip";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NoData } from "@/components/ui/no-data";
import { Dropdown } from "@/components/ui/dropdown";
import { LuSearch, LuPlus, LuInbox, LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";

export interface TableLayoutProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;

  createButtonText?: string;
  onCreateClick?: () => void;
  extraActions?: React.ReactNode;

  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: any;

  // Pagination Props
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];

  children?: React.ReactNode;
}

export function TableLayout({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  createButtonText,
  onCreateClick,
  extraActions,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon = LuInbox,

  totalItems,
  currentPage = 1,
  pageSize = 100,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],

  children,
}: TableLayoutProps) {
  // Compute Pagination Metrics
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const fromIndex = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const toIndex = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Generate Page Numbers Array
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm font-sans">
      {/* Top Controls Toolbar Header */}
      <div className="p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-t-xl">
        <div className="flex items-center gap-3 w-full sm:w-72 md:w-80">
          {onSearchChange !== undefined && (
            <div className="relative w-full">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs font-medium bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800/80 rounded-lg focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all w-full"
              />
              {searchValue && (
                <Tooltip content="Clear search">
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Clear Search"
                >
                  <LuX className="w-3.5 h-3.5" />
                </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {extraActions}
          {createButtonText && onCreateClick && (
            <Button
              onClick={onCreateClick}
              variant="brand"
              className="h-9 text-xs gap-1.5 px-3.5 rounded-lg w-full sm:w-auto justify-center"
            >
              <LuPlus className="w-4 h-4" /> {createButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Table Grid / Empty State */}
      <div className="w-full overflow-x-auto">
        {isEmpty ? (
          <div className="p-8">
            <NoData
              icon={emptyIcon}
              title={emptyTitle || "No matching records"}
              description={
                emptyDescription ||
                (searchValue ? `No items match your search for "${searchValue}".` : "No items have been added yet.")
              }
              action={
                searchValue ? (
                  <Button
                    onClick={() => onSearchChange?.("")}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold rounded-lg gap-1.5"
                  >
                    <LuX className="w-3.5 h-3.5" /> Clear Search
                  </Button>
                ) : createButtonText && onCreateClick ? (
                  <Button onClick={onCreateClick} variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 rounded-lg">
                    <LuPlus className="w-3.5 h-3.5" /> {createButtonText}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Pagination Footer */}
      {!isEmpty && totalItems !== undefined && totalItems > 0 && (
        <div className="p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 text-xs rounded-b-xl">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-zinc-500 dark:text-zinc-400 font-medium text-center sm:text-left w-full sm:w-auto">
            <span>
              Showing <strong className="font-mono text-zinc-800 dark:text-zinc-200">{fromIndex}–{toIndex}</strong> of <strong className="font-mono text-zinc-800 dark:text-zinc-200">{totalItems}</strong> items
            </span>
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-3">
                <span>Show:</span>
                <Dropdown
                  options={pageSizeOptions.map((sz) => ({
                    value: sz,
                    label: `${sz} / page`,
                  }))}
                  value={pageSize}
                  onChange={(val) => onPageSizeChange(Number(val))}
                  size="sm"
                  direction="up"
                  className="min-w-[110px]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="h-7 text-xs font-semibold px-2.5 gap-1 rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
            >
              <LuChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>

            <div className="flex items-center gap-1 px-1 overflow-x-auto">
              {getPageNumbers().map((p, i) =>
                typeof p === "number" ? (
                  <button
                    key={i}
                    onClick={() => onPageChange?.(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      p === currentPage
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={i} className="text-zinc-400 px-0.5">...</span>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="h-7 text-xs font-semibold px-2.5 gap-1 rounded-lg border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
            >
              Next <LuChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
