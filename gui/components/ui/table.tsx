"use client"

import React, { useState, useMemo, useEffect } from "react"
import { TableLayout } from "./table-layout"
import { Loader } from "./loader"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm border-collapse font-sans", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-zinc-50/60 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800/80", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0 divide-y divide-zinc-100 dark:divide-zinc-800/60", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-zinc-200 dark:border-zinc-800 bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-zinc-200 dark:border-zinc-800 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle font-bold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle whitespace-nowrap text-zinc-800 dark:text-zinc-200 font-medium text-xs [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

// ==========================================
// Generic Data Table Component
// ==========================================

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: any;
  /** Extra controls in the toolbar, e.g. a filter dropdown */
  toolbarActions?: React.ReactNode;
  /**
   * Turns on row selection (a checkbox column), keyed by row.id. The header checkbox selects the
   * rows on the current page. Selection is kept across search and pages; the parent owns it.
   */
  selectedIds?: ReadonlySet<number | string>;
  onSelectionChange?: (ids: Set<number | string>) => void;
}

/** Header checkbox with the "some selected" state. */
function SelectAllCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: (v: boolean) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all on this page"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 align-middle accent-brand cursor-pointer"
    />
  );
}

function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = "Search...",
  searchFilter,
  createButtonText,
  onCreateClick,
  emptyTitle = "No results found",
  emptyDescription = "There are no records to display.",
  emptyIcon,
  toolbarActions,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  const selectable = !!selectedIds && !!onSelectionChange;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredData = useMemo(() => {
    if (!searchQuery || !searchFilter) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item) => searchFilter(item, lowerQuery));
  }, [data, searchQuery, searchFilter]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const pageIds = paginatedData.map((item) => item.id).filter((id): id is number | string => id !== undefined);
  const selectedOnPage = selectable ? pageIds.filter((id) => selectedIds.has(id)).length : 0;

  const toggleRow = (id: number | string, on: boolean) => {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (on) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  };

  const togglePage = (on: boolean) => {
    if (!selectable) return;
    const next = new Set(selectedIds);
    pageIds.forEach((id) => (on ? next.add(id) : next.delete(id)));
    onSelectionChange(next);
  };

  return (
    <TableLayout
      searchPlaceholder={searchPlaceholder}
      searchValue={searchQuery}
      onSearchChange={searchFilter ? setSearchQuery : undefined}
      createButtonText={createButtonText}
      onCreateClick={onCreateClick}
      extraActions={toolbarActions}
      isEmpty={!isLoading && filteredData.length === 0}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyIcon={emptyIcon}
      totalItems={filteredData.length}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
    >
      {isLoading ? (
        <div className="py-12">
          <Loader text="Loading..." variant="inline" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider font-bold text-zinc-500">
              {selectable && (
                <TableHead className="w-10 pl-5">
                  <SelectAllCheckbox
                    checked={pageIds.length > 0 && selectedOnPage === pageIds.length}
                    indeterminate={selectedOnPage > 0 && selectedOnPage < pageIds.length}
                    onChange={togglePage}
                  />
                </TableHead>
              )}
              {columns.map((col, index) => (
                <TableHead key={index} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {paginatedData.map((item, index) => (
              <TableRow
                key={item.id ?? index}
                data-state={selectable && item.id !== undefined && selectedIds.has(item.id) ? "selected" : undefined}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors data-[state=selected]:bg-brand/5"
              >
                {selectable && (
                  <TableCell className="w-10 pl-5">
                    {item.id !== undefined && (
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => toggleRow(item.id!, e.target.checked)}
                        className="w-4 h-4 align-middle accent-brand cursor-pointer"
                      />
                    )}
                  </TableCell>
                )}
                {columns.map((col, colIndex) => (
                  <TableCell key={colIndex} className={col.cellClassName}>
                    {col.cell 
                      ? col.cell(item) 
                      : col.accessorKey 
                        ? String(item[col.accessorKey] ?? "") 
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableLayout>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  DataTable,
}
