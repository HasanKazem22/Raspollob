"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LoaderProps {
  text?: string;
  variant?: "inline" | "fullScreen";
}

export function Loader({
  text = "Loading data...",
  variant = "inline",
}: LoaderProps) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
      {/* Premium glowing spinner */}
      <div className="relative w-12 h-12 mb-3.5 flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute inset-0 rounded-full border border-zinc-200 dark:border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-zinc-950 dark:border-white animate-spin" style={{ animationDuration: '0.8s' }} />
        {/* Inner reverse spinner for depth */}
        <div className="w-6 h-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
      </div>

      {/* Pulsing subtext */}
      <p className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400 animate-pulse">
        {text}
      </p>
    </div>
  );

  if (variant === "fullScreen") {
    return (
      <div className="min-h-[50vh] w-full flex items-center justify-center p-4">
        {loaderContent}
      </div>
    );
  }

  return <div className="my-4 w-full flex items-center justify-center">{loaderContent}</div>;
}
