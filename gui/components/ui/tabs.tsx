"use client";

import React from "react";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: IconType;
  /** Extra content after the label, e.g. a count */
  badge?: React.ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Stretch tabs to fill the container (used inside modals) */
  fullWidth?: boolean;
  className?: string;
}

/** The single tab switcher used for page sections and modal steps. */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  fullWidth = false,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "items-center gap-1 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80",
        fullWidth ? "flex w-full" : "inline-flex shrink-0 min-w-max",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
              fullWidth && "flex-1",
              isActive
                ? "bg-[#5c8b29] text-white shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
