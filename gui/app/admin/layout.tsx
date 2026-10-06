"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuChevronRight, LuChevronLeft } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DesktopOnlyCard } from "@/components/ui/DesktopOnlyCard";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_NAV } from "@/components/admin/adminNav";

// Sidebar items and their permissions live in components/admin/adminNav.ts

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { can, isReady, canAccessAdmin } = useAuth();

  // Admin uses the sans UI font everywhere, including dialogs portaled to <body>
  useEffect(() => {
    document.documentElement.classList.add("admin-ui");
    return () => document.documentElement.classList.remove("admin-ui");
  }, []);

  // Dynamic Sidebar Filtering based on Server RolePermission Tree
  const filteredSidebarItems = ADMIN_NAV.filter((item) => can(item.permission));

  // Middleware redirects visitors without a session; this blocks signed-in customers
  if (!isReady) {
    return <Loader variant="fullScreen" text="Checking access..." />;
  }

  if (!canAccessAdmin) {
    return (
      <AccessDeniedCard
        title="Staff Only"
        description="The admin panel is only available to staff accounts. Sign in with a staff account to continue."
      />
    );
  }

  return (
    <>
      {/* Mobile / Small Screen Notice */}
      <div className="block md:hidden">
        <DesktopOnlyCard />
      </div>

      {/* Desktop / Laptop / Tablet Admin Panel */}
      <div className="hidden md:flex h-full relative">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 self-start h-[calc(100vh-99px)] border-r border-border bg-muted/30 flex flex-col transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-52"
          )}
        >
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {filteredSidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                // Labels are hidden when collapsed, so the tooltip names the page
                <Tooltip key={item.href} content={isCollapsed ? item.name : undefined} side="right">
                  <Link
                    href={item.href}
                    aria-label={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      isActive
                        ? "bg-zinc-100 text-zinc-950 dark:bg-white/10 dark:text-white"
                        : "text-muted-foreground hover:bg-zinc-100/50 hover:text-zinc-950 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
                      isCollapsed ? "justify-center px-0" : "justify-between"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && isActive && <LuChevronRight className="h-4 w-4" />}
                  </Link>
                </Tooltip>
              );
            })}
          </nav>
        </aside>

        {/* Floating Toggle Button */}
        <Tooltip content={isCollapsed ? "Expand menu" : "Collapse menu"} side="right">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
            className={cn(
              "fixed top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-border shadow-md z-50 transition-all duration-300 ease-in-out bg-background hover:scale-110 active:scale-95",
              isCollapsed ? "left-[52px]" : "left-[196px]"
            )}
          >
            {isCollapsed ? <LuChevronRight className="h-3 w-3" /> : <LuChevronLeft className="h-3 w-3" />}
          </Button>
        </Tooltip>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-background p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
