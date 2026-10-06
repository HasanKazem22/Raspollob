"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LuLoader } from "react-icons/lu";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Omit for a read-only modal: the footer then shows a single Close button */
  onSave?: () => void;
  children: React.ReactNode;
  saveText?: string;
  /** "danger" renders a red confirm button, for destructive actions */
  saveVariant?: "brand" | "danger";
  isLoading?: boolean;
  disabled?: boolean;
  /**
   * Controls the max-width of the dialog.
   * sm  → 384px  — confirmations, simple forms (3–4 short fields)
   * md  → 512px  — standard forms with images/textareas (default)
   * lg  → 672px  — tables, lists, multi-column content
   * xl  → 896px  — complex layouts, side-by-side panels
   */
  size?: ModalSize;
}

export function Modal({
  isOpen,
  onOpenChange,
  title,
  description,
  onSave,
  children,
  saveText = "Save changes",
  saveVariant = "brand",
  isLoading = false,
  disabled = false,
  size = "md",
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? () => {} : onOpenChange}>
      <DialogContent
        className={cn(
          "w-full rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xl p-0 overflow-hidden flex flex-col",
          // Cap height at 90vh so it never overflows the screen
          "max-h-[90vh]",
          sizeClasses[size]
        )}
      >
        {/* ── Header ── */}
        <DialogHeader className="shrink-0 space-y-1 text-left px-5 pt-5 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <DialogTitle className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {children}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs h-8 px-3 rounded-lg"
          >
            {onSave ? "Cancel" : "Close"}
          </Button>
          {onSave && (
            <Button
              onClick={onSave}
              size="sm"
              variant={saveVariant}
              className="px-4 h-8 rounded-lg text-xs gap-1.5"
              disabled={isLoading || disabled}
            >
              {isLoading && <LuLoader className="w-3.5 h-3.5 animate-spin" />}
              {saveText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
