"use client";

import React, { useState, useRef, useEffect } from "react";
import { LuChevronDown, LuCheck, LuSearch } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: any;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  direction?: "down" | "up";
  /** Adds a search box at the top of the list (for long lists) */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className,
  disabled = false,
  size = "md",
  direction = "down",
  searchable = false,
  searchPlaceholder = "Search...",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const visibleOptions =
    searchable && q
      ? options.filter((opt) => `${opt.label} ${opt.sublabel ?? ""}`.toLowerCase().includes(q))
      : options;

  const toggle = () => {
    setQuery("");
    setIsOpen((open) => !open);
  };

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left min-w-[120px]", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg font-medium transition-colors border text-left cursor-pointer select-none",
          size === "sm" ? "h-8 px-2.5 text-xs" : size === "lg" ? "h-11 px-3.5 text-sm" : "h-9 px-3 text-sm",
          "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 focus:outline-none focus:border-brand dark:focus:border-brand focus:ring-1 focus:ring-brand/40",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="truncate flex items-center gap-2 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
              <span className="truncate font-semibold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-zinc-400 font-normal truncate hidden sm:inline">
                  — {selectedOption.sublabel}
                </span>
              )}
            </>
          ) : (
            <span className="text-zinc-400">{placeholder}</span>
          )}
        </span>
        <LuChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 z-[100] max-h-72 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-2xl scrollbar-none min-w-full w-max max-w-sm",
            direction === "up"
              ? "bottom-full mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
              : "top-full mt-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          )}
        >
          {searchable && (
            <div className="sticky top-0 -m-1 mb-1 p-1.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" aria-hidden />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsOpen(false);
                    if (e.key === "Enter" && visibleOptions.length > 0) {
                      e.preventDefault();
                      onChange(visibleOptions[0].value);
                      setIsOpen(false);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-2 rounded-md bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand/40"
                />
              </div>
            </div>
          )}
          {visibleOptions.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">No matches</p>}
          {visibleOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-md text-xs transition-colors text-left cursor-pointer",
                  isSelected
                    ? "bg-brand text-white font-bold shadow-xs"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                )}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {opt.icon && <opt.icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className={cn("text-[10px] truncate", isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400")}>
                      — {opt.sublabel}
                    </span>
                  )}
                </div>
                {isSelected && <LuCheck className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
