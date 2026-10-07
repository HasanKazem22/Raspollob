"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerActionText: string;
  footerActionLink: string;
}

export function AuthCard({
  children,
  title,
  subtitle,
  footerText,
  footerActionText,
  footerActionLink,
}: AuthCardProps) {
  return (
    <div className="h-full w-full bg-background dark:bg-zinc-950 overflow-y-auto flex flex-col items-center justify-center py-4 px-4 relative">

      {/* Background radial glows */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.03),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.03),transparent_55%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(194,255,61,0.025),transparent_55%)] pointer-events-none" />

      {/* Dot grid */}
      <div
        className="fixed inset-0 opacity-[0.025] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #09090b 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-2xl shadow-zinc-300/40 dark:shadow-black/60">

        {/* Top gradient accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent rounded-t-3xl" />

        <div className="flex flex-col items-center px-7 pt-7 pb-5">

          {/* ── BIG LOGO ── */}
          <Link href="/" className="transition-transform hover:scale-105 py-2 mb-2">
            <Image
              src="/RaspollobLogo_02.png"
              alt="Raspollob Logo"
              width={220}
              height={70}
              className="h-16 w-auto object-contain"
              priority
            />
          </Link>

          {/* Divider */}
          <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 mt-5 mb-4" />

          {/* Title */}
          <div className="w-full mb-3">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>

          {/* Form slot */}
          <div className="w-full">
            {children}
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {footerText}{" "}
            <Link
              href={footerActionLink}
              className="font-bold text-zinc-900 dark:text-white hover:underline underline-offset-4 transition-colors"
            >
              {footerActionText}
            </Link>
          </p>
        </div>

        {/* Bottom gradient accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent rounded-b-3xl" />
      </div>
    </div>
  );
}
