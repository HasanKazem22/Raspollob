"use client";

import React from "react";
import { LuInbox } from "react-icons/lu";

export interface NoDataProps {
  icon?: any;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function NoData({
  icon: Icon = LuInbox,
  title = "No data found",
  description = "No items have been created or match your current filter.",
  action,
}: NoDataProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40 animate-in fade-in duration-200">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
