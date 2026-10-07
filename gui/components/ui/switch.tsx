"use client";

import React from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  /** Tailwind background class used when checked */
  activeColor?: string;
}

export function Switch({
  checked,
  onChange,
  disabled,
  activeColor = "bg-brand",
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? activeColor : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/** Switch with a state label, for table cells ("Active" / "Inactive"). */
export function StatusSwitch({
  checked,
  onChange,
  disabled,
  onLabel = "Active",
  offLabel = "Inactive",
}: SwitchProps & { onLabel?: string; offLabel?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
      <span className="text-[11px] font-semibold text-zinc-500 w-12 text-left">
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );
}

/** Bordered row with icon, title, description and a switch — for settings in forms. */
export function SwitchCard({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: SwitchProps & { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-brand flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-zinc-900 dark:text-white block">{title}</span>
          <span className="text-[11px] text-zinc-500">{description}</span>
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
