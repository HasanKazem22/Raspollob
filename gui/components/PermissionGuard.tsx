"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";

interface PermissionGuardProps {
  require: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ require, fallback, children }: PermissionGuardProps) {
  const { can } = useAuth();

  if (!can(require)) {
    // fallback={null} hides the content silently (e.g. row action buttons)
    return fallback !== undefined ? <>{fallback}</> : <AccessDeniedCard />;
  }

  return <>{children}</>;
}
