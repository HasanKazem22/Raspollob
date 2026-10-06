"use client";

import React, { useState, useEffect } from "react";
import {
  LuServerCrash,
  LuRefreshCw,
  LuActivity,
  LuGlobe,
  LuLock,
  LuShieldAlert,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServerErrorCardProps {
  error?: any;
  onRetry?: () => void | Promise<void>;
  title?: string;
  description?: string;
  variant?: "inline" | "fullScreen";
}

export function ServerErrorCard({
  error,
  onRetry,
  title = "Server Connection Lost",
  description = "Failed to fetch",
  variant = "inline",
}: ServerErrorCardProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
      }, 600);
    }
  };

  // Detect 403 / 401 / Permission / Access Denied error
  const errStatus = error?.status || error?.statusCode;
  const errMsg = typeof error === "string" ? error : error?.message || error?.error || "";
  const isAccessDenied =
    errStatus === 403 ||
    errStatus === 401 ||
    title.toLowerCase().includes("access denied") ||
    errMsg.toLowerCase().includes("denied") ||
    errMsg.toLowerCase().includes("forbidden") ||
    errMsg.toLowerCase().includes("permission");

  const displayTitle = isAccessDenied ? "Access Denied" : title;
  const displayDesc = isAccessDenied
    ? (errMsg || "You do not have permission to view or manage this resource. Please re-login with an authorized account.")
    : (description !== "Failed to fetch" ? description : (errMsg || "Failed to connect to backend server. Please verify your connection."));

  const cardContent = (
    <div
      className={cn(
        "relative group overflow-hidden rounded-2xl border bg-white/40 dark:bg-zinc-950/20 backdrop-blur-xl p-5 sm:p-6 text-center max-w-md w-full mx-auto transition-all duration-500 animate-in fade-in zoom-in-95",
        isAccessDenied
          ? "border-amber-500/20 shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)]"
          : "border-red-500/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.15)]"
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          "absolute -top-24 -left-24 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-500",
          isAccessDenied ? "bg-amber-500/10" : "bg-red-500/10"
        )}
      />

      {/* Glowing Pulsing Icon Ring */}
      <div className="relative mx-auto w-12 h-12 mb-4 flex items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-60",
            isAccessDenied ? "bg-amber-500/15" : "bg-red-500/15"
          )}
          style={{ animationDuration: "3s" }}
        />
        <div
          className={cn(
            "relative w-11 h-11 rounded-xl border flex items-center justify-center shadow-md",
            isAccessDenied
              ? "bg-white dark:bg-zinc-900 border-amber-500/30 text-amber-500 shadow-amber-500/10"
              : "bg-white dark:bg-zinc-900 border-red-500/30 text-red-500 shadow-red-500/10"
          )}
        >
          {isAccessDenied ? <LuLock className="w-5 h-5" /> : <LuServerCrash className="w-5 h-5 animate-pulse" />}
        </div>
      </div>

      {/* Text Info */}
      <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5">
        {displayTitle}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs mx-auto leading-relaxed">
        {displayDesc}
      </p>

      {/* Network / Security Badges */}
      <div className="grid grid-cols-2 gap-2.5 max-w-[320px] mx-auto mb-5">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl justify-center">
          <LuGlobe className="w-3.5 h-3.5 text-zinc-400" />
          <div className="text-[10px] text-left">
            <div className="font-semibold text-zinc-400 leading-none">Your Network</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn("w-1 h-1 rounded-full shrink-0", isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
              <span className={cn("font-bold", isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500")}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl justify-center">
          {isAccessDenied ? <LuShieldAlert className="w-3.5 h-3.5 text-amber-500" /> : <LuActivity className="w-3.5 h-3.5 text-zinc-400" />}
          <div className="text-[10px] text-left">
            <div className="font-semibold text-zinc-400 leading-none">
              {isAccessDenied ? "Security Status" : "Backend API"}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn("w-1 h-1 rounded-full shrink-0 animate-pulse", isAccessDenied ? "bg-amber-500" : "bg-red-500")} />
              <span className={cn("font-bold", isAccessDenied ? "text-amber-600 dark:text-amber-400" : "text-red-500")}>
                {isAccessDenied ? "403 Forbidden" : "Unreachable"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onRetry && (
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="relative overflow-hidden w-full max-w-[240px] h-8 text-xs font-semibold gap-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-800 dark:border-zinc-200 shadow-sm transition-all duration-300 disabled:opacity-85"
        >
          <LuRefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-700", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : "Retry Request"}
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
