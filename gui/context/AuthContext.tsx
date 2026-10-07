"use client";

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { setCookie, getCookie, deleteCookie } from "../lib/utils/cookies";
import { parseJwt } from "../lib/utils/jwt";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { ADMIN_MODULE_KEYS, PermissionTree, resolvePermission } from "../lib/permissions";
import { accountService, type Account } from "../services/accountService";

export interface User {
  id?: number;
  username: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  city?: string;
  address?: string;
  avatarUrl?: string;
  avatar?: string;
  roles: string[];
  exp?: number;
}

export interface AuthResponsePayload {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
  rolePermission: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  /** Effective permission tree for the current visitor (guest tree when signed out) */
  rolePermission: PermissionTree | null;
  isAuthenticated: boolean;
  /** False until the session and permissions have been loaded on mount */
  isReady: boolean;
  /** Signed in and allowed into at least one admin module */
  canAccessAdmin: boolean;
  roles: string[];
  /** Stores the session and navigates to `redirectTo` (default "/") */
  login: (authResponse: AuthResponsePayload | string, redirectTo?: string) => void;
  logout: () => void;
  /** Raw permission check against the tree (no ADMIN bypass) */
  canAccess: (path: string) => boolean;
  /** Permission check used everywhere in the UI: ADMIN always passes. Use PERM constants. */
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  /** Re-fetch permissions from the server, e.g. after editing role permissions */
  refreshPermissions: () => Promise<void>;
  updateUser: (partialUser: Partial<User>) => void;
  /** Applies the server's copy of the signed-in user's profile (after saving, uploading a photo…) */
  applyAccount: (account: Account) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** The profile fields the server owns; anything cached in the browser is replaced by these. */
function accountToUser(account: Account): Partial<User> {
  return {
    id: account.id,
    username: account.username,
    fullName: account.fullName,
    email: account.email ?? undefined,
    mobile: account.mobile,
    city: account.city ?? undefined,
    address: account.address ?? undefined,
    avatarUrl: account.avatarUrl ?? undefined,
    avatar: undefined,
    roles: account.roles,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rolePermission, setRolePermission] = useState<PermissionTree | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  /** Loads the caller's effective permissions (signed-in roles, or the guest role). */
  /** Merges fields into the signed-in user and keeps the cached copy in sync. */
  const mergeUser = useCallback((partialUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partialUser };
      localStorage.setItem("user_info", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshPermissions = useCallback(async () => {
    try {
      const res = await apiFetch("/auth/permissions");
      const tree = (res?.data ?? null) as PermissionTree | null;
      setRolePermission(tree);
      if (tree && localStorage.getItem("access_token")) {
        localStorage.setItem("role_permission", JSON.stringify(tree));
      }
    } catch (err) {
      // Keep whatever we had (e.g. the stored tree) if the server is unreachable
      console.warn("Failed to load permissions", err);
    }
  }, []);

  const clearSession = () => {
    deleteCookie("auth_token");
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("role_permission");
    }
    setUser(null);
    setRolePermission(null);
  };

  useEffect(() => {
    const token = getCookie("auth_token") || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
    const savedPerms = typeof window !== "undefined" ? localStorage.getItem("role_permission") : null;
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("user_info") : null;

    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            setUser({
              username: decoded.sub,
              roles: decoded.authorities ? decoded.authorities : [],
              exp: decoded.exp,
            });
          }
        } else {
          setUser({
            username: decoded.sub,
            roles: decoded.authorities ? decoded.authorities : [],
            exp: decoded.exp,
          });
        }

        if (savedPerms) {
          try {
            setRolePermission(JSON.parse(savedPerms));
          } catch (e) {
            console.error("Failed to parse stored role_permission JSON", e);
          }
        }
      } else {
        // Expired session: sign out quietly; protected pages redirect on their own
        clearSession();
      }
    }

    // Always ask the server: an admin may have changed this role's permissions since last visit.
    // Ready only once that settles, so guards never act on stale or missing permissions.
    refreshPermissions().finally(() => setIsReady(true));

    // Profile (name, photo…) comes from the server too, so it's the same on every device
    if (getCookie("auth_token") || localStorage.getItem("access_token")) {
      accountService
        .getMe()
        .then((account) => mergeUser(accountToUser(account)))
        .catch(() => {
          // Offline or token expired: keep the cached copy; protected pages handle sign-in
        });
    }
  }, [refreshPermissions, mergeUser]);

  const login = (payload: AuthResponsePayload | any, redirectTo: string = "/") => {
    const token = typeof payload === "string" ? payload : payload?.accessToken || payload?.token;
    const refreshToken = typeof payload === "object" ? payload?.refreshToken : null;
    if (token) {
      setCookie("auth_token", token);
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", token);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
      }
    }

    const userData = typeof payload === "object" ? (payload.user || {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      // Never assume a role the server didn't send
      roles: payload.roles || [],
    }) : null;

    if (userData) {
      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("user_info", JSON.stringify(userData));
      }
    }

    const perms = typeof payload === "object" ? payload.rolePermission : null;
    if (perms) {
      setRolePermission(perms);
      if (typeof window !== "undefined") {
        localStorage.setItem("role_permission", JSON.stringify(perms));
      }
    }

    router.push(redirectTo);
  };

  const logout = () => {
    clearSession();
    refreshPermissions(); // back to the guest role's permissions
    router.push("/login");
  };

  /** Same rule as the server: every module on the path must have access. */
  const canAccess = (path: string): boolean => resolvePermission(rolePermission, path);

  const roles = user?.roles || [];

  const hasRole = (role: string) => {
    return roles.includes(role);
  };

  const isAdmin = hasRole("ADMIN");

  const can = (permission: string) => isAdmin || canAccess(permission);

  // Decided by permissions, not by role name: any admin module grants entry to the panel
  const canAccessAdmin = !!user && (isAdmin || ADMIN_MODULE_KEYS.some((key) => canAccess(`${key}.isAccess`)));

  const updateUser = mergeUser;
  const applyAccount = (account: Account) => mergeUser(accountToUser(account));

  return (
    <AuthContext.Provider
      value={{
        user,
        rolePermission,
        isAuthenticated: !!user,
        isReady,
        canAccessAdmin,
        roles,
        login,
        logout,
        canAccess,

        can,
        hasRole,
        refreshPermissions,
        updateUser,
        applyAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
