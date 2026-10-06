"use client";

import React from "react";
import type { IconType } from "react-icons";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import { SegmentedTabs, TabItem } from "@/components/ui/tabs";
import { AdminPageHeader } from "./AdminPageHeader";

interface AdminPageProps {
  title: string;
  description: string;
  /** Same icon as the page's sidebar entry */
  icon: IconType;
  /** Permission path required to view the page; omit for open pages */
  permission?: string;
  /** Message shown when the permission check fails */
  deniedDescription?: string;
  children: React.ReactNode;
}

/** Standard admin page shell: permission guard, centered header, consistent spacing. */
export function AdminPage({
  title,
  description,
  icon,
  permission,
  deniedDescription,
  children,
}: AdminPageProps) {
  const content = (
    <div className="space-y-5">
      <AdminPageHeader title={title} description={description} icon={icon} />
      {children}
    </div>
  );

  if (!permission) return content;

  return (
    <PermissionGuard
      require={permission}
      fallback={<AccessDeniedCard title={`${title} Restricted`} description={deniedDescription} />}
    >
      {content}
    </PermissionGuard>
  );
}

/** Centered section tabs under an admin page header (scrolls horizontally on small screens). */
export function AdminPageTabs<T extends string>(props: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center justify-start md:justify-center overflow-x-auto pb-1 w-full no-scrollbar">
      <SegmentedTabs {...props} />
    </div>
  );
}
