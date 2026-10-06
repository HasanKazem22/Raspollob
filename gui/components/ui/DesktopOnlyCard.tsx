"use client";

import Link from "next/link";
import { LuMonitor, LuArrowLeft, LuShieldAlert } from "react-icons/lu";
import { Button } from "@/components/ui/button";

export function DesktopOnlyCard() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 md:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon Header */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-inner">
          <LuMonitor className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm">
            <LuShieldAlert className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Desktop or Tablet Required
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Admin Control Hub</strong> is optimized for PC, Laptop, and Tablet displays.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 text-left text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <span>💡 How to access administration:</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            Please open this website on a <strong className="text-zinc-800 dark:text-zinc-200">PC, Laptop, or Tablet screen</strong> to manage system settings and data tables.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link href="/">
            <Button
              className="w-full h-10 text-xs font-semibold gap-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm"
            >
              <LuArrowLeft className="w-4 h-4" />
              <span>Return to Customer Homepage</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
