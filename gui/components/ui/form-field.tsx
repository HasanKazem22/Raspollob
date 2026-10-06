import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  /** Small helper text under the control */
  hint?: string;
  /** Element shown at the right of the label row (e.g. a badge) */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + optional hint, with one consistent style across forms. */
export function FormField({
  label,
  htmlFor,
  required,
  optional,
  hint,
  action,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <Label htmlFor={htmlFor} className="gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
          {required && <span className="text-red-500">*</span>}
          {optional && <span className="text-[11px] font-normal text-zinc-400">(optional)</span>}
        </Label>
        {action}
      </div>
      {children}
      {hint && <p className={cn("mt-1 text-[11px] text-zinc-400")}>{hint}</p>}
    </div>
  );
}
