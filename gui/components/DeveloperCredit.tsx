import Image from "next/image";
import { cn } from "@/lib/utils";

/** "© 2026 Raspollob. All rights reserved." */
export function Copyright({ className }: { className?: string }) {
  return (
    <span className={className}>
      © {new Date().getFullYear()} <span className="font-semibold text-zinc-800">Raspollob</span>. All rights reserved.
    </span>
  );
}

/**
 * "Developed by" + the Bear Tech logo, used in the store footer and the admin sidebar.
 */
export function DeveloperCredit({
  size = "md",
  showLabel = true,
  className,
}: {
  size?: "sm" | "md";
  /** False shows only the logo (collapsed admin sidebar) */
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-zinc-600", size === "sm" ? "text-[11px]" : "text-[13px]", className)}>
      {showLabel && <span className="whitespace-nowrap">Developed by</span>}
      <Image
        src="/BearTechLogo.png"
        alt="Bear Tech"
        width={240}
        height={171}
        className={cn("w-auto shrink-0", size === "sm" ? "h-7" : "h-8")}
      />
    </span>
  );
}
