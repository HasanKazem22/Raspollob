"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

/** Mount once near the root; shares open/close timing across all tooltips. */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={150} skipDelayDuration={300}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

interface TooltipProps {
  /** Tooltip text; when empty the child renders without a tooltip */
  content?: React.ReactNode;
  /** A single focusable element (button, link) — it becomes the trigger */
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * The project's one tooltip: small brand-green pill with white bold text.
 * Shows on hover and keyboard focus, stays on screen near edges, and works inside dialogs.
 * Use it instead of the native `title` attribute; keep an aria-label on icon-only buttons.
 */
export function Tooltip({ content, children, side = "bottom", align = "center" }: TooltipProps) {
  if (!content) return children;

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className="z-[300] max-w-[240px] rounded px-2 py-1 bg-brand text-white text-[10px] font-bold leading-snug shadow-sm select-none data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
