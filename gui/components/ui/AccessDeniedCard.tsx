"use client";

import React from "react";
import { LuShieldAlert, LuArrowLeft } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AccessDeniedCardProps {
  title?: string;
  description?: string;
  variant?: "inline" | "fullScreen";
  showBackButton?: boolean;
}

export function AccessDeniedCard({
  title = "Access Denied",
  description = "You do not have permission to view this module. Please contact your system administrator if you believe this is an error.",
  variant = "fullScreen",
  showBackButton = true,
}: AccessDeniedCardProps) {
  const router = useRouter();

  const cardContent = (
    <div className="relative group overflow-hidden rounded-2xl border border-red-500/10 dark:border-red-500/20 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-xl p-5 sm:p-6 text-center max-w-md w-full mx-auto shadow-[0_0_50px_-12px_rgba(239,68,68,0.08)] hover:shadow-[0_0_60px_-10px_rgba(239,68,68,0.12)] transition-all duration-500 animate-in fade-in zoom-in-95 duration-500">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -left-24 w-40 h-40 rounded-full bg-red-500/5 blur-3xl pointer-events-none transition-all duration-500" />
      <div className="absolute -bottom-24 -right-24 w-40 h-40 rounded-full bg-red-500/5 blur-3xl pointer-events-none transition-all duration-500" />

      {/* Glowing Pulsing Icon Ring */}
      <div className="relative mx-auto w-12 h-12 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-red-500/10 dark:bg-red-500/15 animate-ping opacity-60" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500/15 to-red-500/5 blur-sm" />
        <div className="relative w-10.5 h-10.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-500/20 dark:border-red-500/30 flex items-center justify-center text-red-500 shadow-md shadow-red-500/10">
          <LuShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Text Info */}
      <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>

      {/* Back Button */}
      {showBackButton && (
        <Button
          onClick={() => router.back()}
          className="relative overflow-hidden w-full max-w-[200px] h-8 text-xs font-semibold gap-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-800 dark:border-zinc-200 shadow-sm transition-all duration-300"
        >
          <LuArrowLeft className="w-3.5 h-3.5" />
          Go Back
        </Button>
      )}
    </div>
  );

  if (variant === "fullScreen") {
    return (
      <div className="min-h-[50vh] w-full flex items-center justify-center p-4">
        {cardContent}
      </div>
    );
  }

  return <div className="my-4 w-full">{cardContent}</div>;
}
