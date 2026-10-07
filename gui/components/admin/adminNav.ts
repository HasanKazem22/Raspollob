import type { IconType } from "react-icons";
import { LuHouse, LuLayoutDashboard, LuMail, LuPackage, LuShield, LuShoppingBag } from "react-icons/lu";
import { PERM } from "@/lib/permissions";
import type { AdminCounts } from "@/components/admin/AdminCounts";

export interface AdminNavItem {
  name: string;
  href: string;
  icon: IconType;
  /** Permission needed to see and open the page */
  permission: string;
  /** Which live count to show as a badge (new orders, unread messages) */
  countKey?: keyof AdminCounts;
}

/** Admin sidebar, in display order. Each page shows only to roles with its permission. */
export const ADMIN_NAV: AdminNavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LuLayoutDashboard, permission: PERM.dashboard.access },
  { name: "Home", href: "/admin/home", icon: LuHouse, permission: PERM.home.access },
  { name: "Orders", href: "/admin/orders", icon: LuShoppingBag, permission: PERM.order.access, countKey: "newOrders" },
  { name: "Messages", href: "/admin/messages", icon: LuMail, permission: PERM.message.access, countKey: "unreadMessages" },
  { name: "Products", href: "/admin/products", icon: LuPackage, permission: PERM.product.access },
  { name: "User & Role Setup", href: "/admin/user-role-setup", icon: LuShield, permission: PERM.users.access },
];

/** First admin page the user may open (where /admin sends people without dashboard access). */
export function firstAllowedAdminPath(can: (permission: string) => boolean): string | null {
  return ADMIN_NAV.find((item) => can(item.permission))?.href ?? null;
}

/** Whether a link inside the admin panel (e.g. "/admin/orders") is allowed for this user. */
export function canOpenAdminPath(href: string, can: (permission: string) => boolean): boolean {
  const item = [...ADMIN_NAV].sort((a, b) => b.href.length - a.href.length).find((i) => href.startsWith(i.href));
  return item ? can(item.permission) : true;
}
