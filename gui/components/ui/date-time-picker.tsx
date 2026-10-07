"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { useState } from "react";
import { Popover } from "radix-ui";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuClock, LuX } from "react-icons/lu";
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

/**
 * Date + time picker styled like the rest of the UI.
 * Value format matches <input type="datetime-local">: "YYYY-MM-DDTHH:mm" (local time) or "".
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, "0") }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, "0") }));

interface Parts {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number; // 0-23
  minute: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parse(value: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  return { year: +m[1], month: +m[2] - 1, day: +m[3], hour: +m[4], minute: +m[5] };
}

function format(p: Parts): string {
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

function display(p: Parts): string {
  const hour12 = p.hour % 12 || 12;
  return `${pad(p.day)} ${MONTHS[p.month].slice(0, 3)} ${p.year}, ${hour12}:${pad(p.minute)} ${p.hour < 12 ? "AM" : "PM"}`;
}

/** Comparable day number (YYYYMMDD) for before/after checks. */
const dayKey = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Time used when a day is picked before any time is set, "HH:mm" */
  defaultTime?: string;
  /** Days before this value ("YYYY-MM-DDTHH:mm") can't be picked */
  min?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  defaultTime = "00:00",
  min,
  disabled,
  className,
}: DateTimePickerProps) {
  const selected = parse(value);
  const minParts = min ? parse(min) : null;
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.getMonth());

  const handleOpenChange = (next: boolean) => {
    // Re-center the calendar on the selected date each time it opens
    if (next) {
      setViewYear(selected?.year ?? today.getFullYear());
      setViewMonth(selected?.month ?? today.getMonth());
    }
    setOpen(next);
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const [defaultHour, defaultMinute] = defaultTime.split(":").map(Number);

  const pickDay = (y: number, m: number, d: number) => {
    onChange(format({ year: y, month: m, day: d, hour: selected?.hour ?? defaultHour, minute: selected?.minute ?? defaultMinute }));
  };

  /** Change the time; picks today if no day is selected yet. */
  const setTime = (patch: Partial<Pick<Parts, "hour" | "minute">>) => {
    const base: Parts = selected ?? {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
      hour: defaultHour,
      minute: defaultMinute,
    };
    onChange(format({ ...base, ...patch }));
  };

  const hour12 = selected ? selected.hour % 12 || 12 : undefined;
  const isPm = selected ? selected.hour >= 12 : false;
  const to24 = (h12: number, pm: boolean) => (h12 % 12) + (pm ? 12 : 0);

  // 6-week grid starting on the Sunday before the 1st
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells = Array.from({ length: 42 }, (_, i) => new Date(viewYear, viewMonth, i - firstWeekday + 1));

  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedKey = selected ? dayKey(selected.year, selected.month, selected.day) : null;
  const minKey = minParts ? dayKey(minParts.year, minParts.month, minParts.day) : null;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className={cn("relative", className)}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              "h-9 w-full flex items-center gap-2 rounded-md border border-zinc-200 bg-transparent pl-3 pr-8 text-sm text-left transition-colors outline-none cursor-pointer",
              "hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400/50 disabled:opacity-50 disabled:cursor-not-allowed",
              open && "border-brand ring-1 ring-brand/30"
            )}
          >
            <LuCalendar className="w-4 h-4 shrink-0 text-zinc-400" />
            <span className={cn("truncate", selected ? "text-zinc-900" : "text-zinc-400")}>
              {selected ? display(selected) : placeholder}
            </span>
          </button>
        </Popover.Trigger>
        {selected && !disabled && (
          <Tooltip content="Clear">
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear date"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <LuX className="w-3.5 h-3.5" />
          </button>
          </Tooltip>
        )}
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[200] w-[292px] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <Tooltip content="Previous month" side="top">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            >
              <LuChevronLeft className="w-4 h-4" />
            </button>
            </Tooltip>
            <span className="text-sm font-bold text-zinc-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Tooltip content="Next month" side="top">
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            >
              <LuChevronRight className="w-4 h-4" />
            </button>
            </Tooltip>
          </div>

          {/* Calendar */}
          <div className="grid grid-cols-7 gap-0.5 text-center" role="grid">
            {WEEKDAYS.map((d) => (
              <span key={d} className="h-7 flex items-center justify-center text-[10px] font-bold uppercase text-zinc-400">
                {d}
              </span>
            ))}
            {cells.map((date) => {
              const y = date.getFullYear();
              const m = date.getMonth();
              const d = date.getDate();
              const key = dayKey(y, m, d);
              const inMonth = m === viewMonth;
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;
              const isDisabled = minKey !== null && key < minKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickDay(y, m, d)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  aria-label={`${d} ${MONTHS[m]} ${y}`}
                  className={cn(
                    "relative h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30",
                    isSelected
                      ? "bg-brand text-white shadow-sm"
                      : inMonth
                        ? "text-zinc-800 hover:bg-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  {d}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time */}
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
            <LuClock className="w-4 h-4 text-zinc-400 shrink-0" />
            <Dropdown
              size="sm"
              options={HOURS}
              value={hour12}
              onChange={(h: number) => setTime({ hour: to24(h, isPm) })}
              placeholder="HH"
              direction="up"
              className="min-w-0 w-[64px]"
            />
            <span className="text-zinc-400 font-bold">:</span>
            <Dropdown
              size="sm"
              // Keep a non-5-minute value selectable if it came from the server
              options={
                selected && selected.minute % 5 !== 0
                  ? [...MINUTES, { value: selected.minute, label: pad(selected.minute) }].sort((a, b) => a.value - b.value)
                  : MINUTES
              }
              value={selected?.minute}
              onChange={(min: number) => setTime({ minute: min })}
              placeholder="MM"
              direction="up"
              className="min-w-0 w-[64px]"
            />
            <div className="ml-auto inline-flex p-0.5 rounded-lg bg-zinc-100 border border-zinc-200">
              {(["AM", "PM"] as const).map((period) => {
                const active = selected ? (period === "PM") === isPm : false;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setTime({ hour: to24(hour12 ?? (defaultHour % 12 || 12), period === "PM") })}
                    className={cn(
                      "px-2.5 h-7 rounded-md text-[11px] font-bold transition-colors cursor-pointer",
                      active ? "bg-brand text-white shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange(format({
                  year: now.getFullYear(),
                  month: now.getMonth(),
                  day: now.getDate(),
                  hour: now.getHours(),
                  minute: Math.floor(now.getMinutes() / 5) * 5,
                }));
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
              }}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
