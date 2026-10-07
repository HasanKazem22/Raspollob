import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuCircleAlert,
  LuClock,
  LuCreditCard,
  LuLightbulb,
  LuMail,
  LuPackageCheck,
  LuPartyPopper,
  LuTriangleAlert,
  LuTrendingUp,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { DashboardData, DashboardInsight, InsightLevel } from "@/types/dashboard";
import { useAuth } from "@/context/AuthContext";
import { canOpenAdminPath } from "@/components/admin/adminNav";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

// ─── To do ───────────────────────────────────────────────────────────────────

interface Task {
  icon: IconType;
  text: string;
  hint: string;
  action: string;
  href: string;
  urgent?: boolean;
}

/** Tips already shown as a task with a live count. */
const COVERED_BY_TASKS = new Set(["PENDING_OVERDUE", "VERIFY_PAYMENTS", "UNREAD_MESSAGES"]);

const SUGGESTION_STYLE: Record<InsightLevel, { icon: IconType; label: string; className: string }> = {
  CRITICAL: { icon: LuCircleAlert, label: "Urgent", className: "bg-red-50 text-red-600" },
  WARNING: { icon: LuTriangleAlert, label: "Important", className: "bg-amber-50 text-amber-700" },
  TIP: { icon: LuLightbulb, label: "Tip", className: "bg-brand/10 text-brand-strong" },
  GOOD: { icon: LuTrendingUp, label: "Good news", className: "bg-brand/10 text-brand-strong" },
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function buildTasks(a: DashboardData["attention"]): Task[] {
  const tasks: Task[] = [];
  const overdue = !!a.oldestPendingAt && Date.now() - new Date(a.oldestPendingAt).getTime() > 24 * 3_600_000;

  if (a.pendingOrders > 0) {
    tasks.push({
      icon: LuClock,
      text: `${plural(a.pendingOrders, "order is", "orders are")} waiting for you to confirm`,
      hint: overdue ? "The oldest has waited more than a day" : "Call the customer, then confirm",
      action: "Confirm",
      href: "/admin/orders",
      urgent: overdue,
    });
  }
  if (a.awaitingPaymentVerification > 0) {
    tasks.push({
      icon: LuCreditCard,
      text: `${plural(a.awaitingPaymentVerification, "online payment", "online payments")} to check`,
      hint: "Match the transaction ID with your bKash / Nagad / Rocket",
      action: "Check",
      href: "/admin/orders",
    });
  }
  if (a.readyToShip > 0) {
    tasks.push({
      icon: LuPackageCheck,
      text: `${plural(a.readyToShip, "order is", "orders are")} ready to send`,
      hint: "Pack them and hand them to the courier",
      action: "View",
      href: "/admin/orders",
    });
  }
  if (a.unreadMessages > 0) {
    tasks.push({
      icon: LuMail,
      text: `${plural(a.unreadMessages, "new customer message", "new customer messages")}`,
      hint: "A quick reply often turns a question into an order",
      action: "Reply",
      href: "/admin/messages",
    });
  }
  return tasks;
}

export function TodoList({ attention, insights }: { attention: DashboardData["attention"]; insights: DashboardInsight[] }) {
  const { can } = useAuth();
  const tasks = buildTasks(attention).filter((t) => canOpenAdminPath(t.href, can));
  const suggestions = insights.filter((i) => !COVERED_BY_TASKS.has(i.code));

  if (tasks.length === 0 && suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px] gap-2">
        <span className="w-12 h-12 rounded-2xl bg-brand/10 text-brand-strong flex items-center justify-center">
          <LuPartyPopper className="w-6 h-6" />
        </span>
        <p className="text-sm font-semibold text-zinc-900">You&apos;re all caught up</p>
        <p className="text-xs text-zinc-500 max-w-[220px]">No orders, payments or messages are waiting for you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tasks.length > 0 && (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.text}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                t.urgent ? "border-red-100 bg-red-50/50" : "border-zinc-100 bg-zinc-50/60"
              )}
            >
              <span
                className={cn(
                  "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center",
                  t.urgent ? "bg-red-100 text-red-600" : "bg-amber-100/70 text-amber-700"
                )}
              >
                <t.icon className="w-[18px] h-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-zinc-900 leading-snug">{t.text}</p>
                <p className={cn("text-[11px] leading-snug", t.urgent ? "text-red-600" : "text-zinc-500")}>{t.hint}</p>
              </div>
              <Link
                href={t.href}
                className="shrink-0 h-8 px-3 rounded-lg bg-zinc-900 text-white text-xs font-semibold flex items-center hover:bg-zinc-700 transition-colors"
              >
                {t.action}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Suggestions</p>
          <ul className="space-y-3">
            {suggestions.map((s) => {
              const style = SUGGESTION_STYLE[s.level];
              return (
                <li key={s.code} className="flex gap-3">
                  <span className={cn("w-7 h-7 shrink-0 rounded-lg flex items-center justify-center", style.className)}>
                    <style.icon className="w-3.5 h-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 leading-snug">
                      <span className="sr-only">{style.label}: </span>
                      {s.title}
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{s.message}</p>
                    {s.actionLabel && s.actionHref && canOpenAdminPath(s.actionHref, can) && (
                      <Link href={s.actionHref} className="text-xs font-semibold text-brand-strong hover:underline">
                        {s.actionLabel} →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Bar list (magnitude, one hue) ─────────────────────────────────────────

export interface BarRow {
  key: string;
  label: React.ReactNode;
  value: number;
  display: string;
  sub?: string;
}

/** Horizontal bars for comparing a handful of amounts; values are always printed. */
export function BarList({ rows, emptyText }: { rows: BarRow[]; emptyText: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (rows.length === 0 || max === 0) {
    return <p className="text-xs text-zinc-400 py-6 text-center">{emptyText}</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-xs text-zinc-700 min-w-0 truncate">{row.label}</span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums shrink-0">
              {row.display}
              {row.sub && <span className="ml-1 font-normal text-zinc-400">{row.sub}</span>}
            </span>
          </div>
          <div className="h-2 rounded-r bg-zinc-100" aria-hidden>
            <div
              className="h-full rounded-r bg-brand transition-[width] duration-500"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
