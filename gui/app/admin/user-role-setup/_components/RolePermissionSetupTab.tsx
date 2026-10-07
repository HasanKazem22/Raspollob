"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { IconType } from "react-icons";
import {
  LuHouse,
  LuLayers,
  LuLayoutDashboard,
  LuLoader,
  LuLock,
  LuMail,
  LuPackage,
  LuRotateCcw,
  LuSave,
  LuShield,
  LuShoppingBag,
  LuStore,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Loader } from "@/components/ui/loader";
import { Switch } from "@/components/ui/switch";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { useAuth } from "@/context/AuthContext";
import { PERM, type PermissionNode, type PermissionNodeValue } from "@/lib/permissions";
import { userRoleService } from "@/services/userRoleService";
import { cn } from "@/lib/utils";

type Tree = Record<string, PermissionNodeValue>;
type ToggleAccess = (keys: string[], on: boolean) => void;
type ToggleAction = (keys: string[], action: string, on: boolean) => void;

const GUEST_ROLE = "GUEST";

const MODULE_ICONS: Record<string, IconType> = {
  storefront: LuStore,
  dashboard: LuLayoutDashboard,
  home: LuHouse,
  order: LuShoppingBag,
  contactMessage: LuMail,
  product: LuPackage,
  userRoleSetup: LuShield,
};

const ROLE_HINTS: Record<string, string> = {
  ADMIN: "Always full access",
  MANAGER: "Store staff",
  CUSTOMER: "Logged-in shoppers",
  GUEST: "Visitors not logged in",
};

// ─── Tree helpers ─────────────────────────────────────────────────────────────

/** Expands a stored tree to the catalog's exact shape: missing = off, unknown keys dropped. */
function normalize(nodes: PermissionNode[], stored: unknown, grantAll = false): Tree {
  const src = (stored && typeof stored === "object" ? stored : {}) as Record<string, any>;
  const out: Tree = {};
  for (const node of nodes) {
    const value = src[node.key] ?? {};
    out[node.key] = {
      isAccess: grantAll || value.isAccess === true,
      actions: Object.fromEntries(node.actions.map((a) => [a.key, grantAll || value.actions?.[a.key] === true])),
      subModules: normalize(node.subModules, value.subModules, grantAll),
    };
  }
  return out;
}

function updateAt(tree: Tree, keys: string[], fn: (node: PermissionNodeValue) => PermissionNodeValue): Tree {
  const [head, ...rest] = keys;
  const node = tree[head];
  return {
    ...tree,
    [head]: rest.length ? { ...node, subModules: updateAt(node.subModules, rest, fn) } : fn(node),
  };
}

function setAll(node: PermissionNodeValue, on: boolean): PermissionNodeValue {
  return {
    isAccess: on,
    actions: Object.fromEntries(Object.keys(node.actions).map((k) => [k, on])),
    subModules: Object.fromEntries(Object.entries(node.subModules).map(([k, v]) => [k, setAll(v, on)])),
  };
}

// ─── UI pieces ────────────────────────────────────────────────────────────────

function ActionCheckboxes({
  node,
  value,
  keys,
  readOnly,
  onToggleAction,
}: {
  node: PermissionNode;
  value: PermissionNodeValue;
  keys: string[];
  readOnly: boolean;
  onToggleAction: ToggleAction;
}) {
  if (node.actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {node.actions.map((a) => (
        <label
          key={a.key}
          className={cn(
            "inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 select-none",
            readOnly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <input
            type="checkbox"
            checked={value.actions[a.key]}
            disabled={readOnly}
            onChange={(e) => onToggleAction(keys, a.key, e.target.checked)}
            className="w-4 h-4 accent-brand cursor-pointer disabled:cursor-default"
          />
          {a.label}
        </label>
      ))}
    </div>
  );
}

/** One module: name + switch; its options open underneath once it's on. */
function ModuleRow({
  node,
  value,
  readOnly,
  onToggleAccess,
  onToggleAction,
}: {
  node: PermissionNode;
  value: PermissionNodeValue;
  readOnly: boolean;
  onToggleAccess: ToggleAccess;
  onToggleAction: ToggleAction;
}) {
  const Icon = MODULE_ICONS[node.key] ?? LuLayers;
  const keys = [node.key];
  const hasOptions = node.actions.length > 0 || node.subModules.length > 0;

  return (
    <li className="px-4 sm:px-5 py-4">
      <div className="flex items-center gap-3">
        <Icon
          className={cn("w-[18px] h-[18px] shrink-0", value.isAccess ? "text-brand" : "text-zinc-400")}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{node.label}</p>
          <p className="text-xs text-zinc-500">{node.description}</p>
        </div>
        <Switch
          checked={value.isAccess}
          disabled={readOnly}
          onChange={(on) => onToggleAccess(keys, on)}
        />
      </div>

      {value.isAccess && hasOptions && (
        <div className="mt-3 ml-[30px] space-y-3">
          <ActionCheckboxes node={node} value={value} keys={keys} readOnly={readOnly} onToggleAction={onToggleAction} />

          {node.subModules.map((sub) => {
            const subValue = value.subModules[sub.key];
            const subKeys = [...keys, sub.key];
            return (
              <div key={sub.key} className="border-l-2 border-zinc-100 dark:border-zinc-800 pl-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{sub.label}</p>
                    <p className="text-xs text-zinc-500">{sub.description}</p>
                  </div>
                  <Switch
                    checked={subValue.isAccess}
                    disabled={readOnly}
                    onChange={(on) => onToggleAccess(subKeys, on)}
                  />
                </div>
                {subValue.isAccess && (
                  <ActionCheckboxes
                    node={sub}
                    value={subValue}
                    keys={subKeys}
                    readOnly={readOnly}
                    onToggleAction={onToggleAction}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

function ModuleGroup({
  title,
  nodes,
  tree,
  readOnly,
  onToggleAccess,
  onToggleAction,
}: {
  title: string;
  nodes: PermissionNode[];
  tree: Tree;
  readOnly: boolean;
  onToggleAccess: ToggleAccess;
  onToggleAction: ToggleAction;
}) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
        {nodes.map((node) => (
          <ModuleRow
            key={node.key}
            node={node}
            value={tree[node.key]}
            readOnly={readOnly}
            onToggleAccess={onToggleAccess}
            onToggleAction={onToggleAction}
          />
        ))}
      </ul>
    </section>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

interface LoadedRole {
  role: string;
  locked: boolean;
  original: Tree;
}

export function RolePermissionSetupTab() {
  const { can, refreshPermissions } = useAuth();
  const canSave = can(PERM.users.permissions.update);

  const [catalog, setCatalog] = useState<PermissionNode[] | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [setupError, setSetupError] = useState<unknown>(null);
  const [setupAttempt, setSetupAttempt] = useState(0);

  const [selectedRole, setSelectedRole] = useState("CUSTOMER");
  const [loaded, setLoaded] = useState<LoadedRole | null>(null);
  const [tree, setTree] = useState<Tree>({});
  const [treeError, setTreeError] = useState<{ role: string; error: unknown } | null>(null);
  const [treeAttempt, setTreeAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Catalog + role list
  useEffect(() => {
    let cancelled = false;
    Promise.all([userRoleService.getPermissionCatalog(), userRoleService.getRoles()])
      .then(([nodes, roleList]) => {
        if (cancelled) return;
        const names = roleList.map((r) => r.name);
        if (!names.includes(GUEST_ROLE)) names.push(GUEST_ROLE);
        setCatalog(nodes);
        setRoles(names);
        setSetupError(null);
      })
      .catch((err) => {
        if (!cancelled) setSetupError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [setupAttempt]);

  // Selected role's permissions
  useEffect(() => {
    if (!catalog) return;
    let cancelled = false;
    userRoleService
      .getRolePermission(selectedRole)
      .then((res) => {
        if (cancelled) return;
        const normalized = normalize(catalog, res.permissionTree, res.locked);
        setLoaded({ role: selectedRole, locked: res.locked, original: normalized });
        setTree(normalized);
        setTreeError(null);
      })
      .catch((error) => {
        if (!cancelled) setTreeError({ role: selectedRole, error });
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, selectedRole, treeAttempt]);

  const isTreeReady = loaded?.role === selectedRole;
  const isDirty = !!loaded && isTreeReady && JSON.stringify(tree) !== JSON.stringify(loaded.original);
  const readOnly = !loaded || !isTreeReady || loaded.locked || !canSave;

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const adminNodes = useMemo(() => catalog?.filter((n) => n.group === "ADMIN") ?? [], [catalog]);
  const storefrontNodes = useMemo(() => catalog?.filter((n) => n.group === "STOREFRONT") ?? [], [catalog]);

  const roleOptions = roles.map((name) => ({ value: name, label: name, sublabel: ROLE_HINTS[name] }));

  const handleRoleChange = (role: string) => {
    if (role === selectedRole) return;
    if (isDirty && !window.confirm(`You have unsaved changes for ${selectedRole}. Discard them?`)) return;
    setSelectedRole(role);
  };

  // Closing a section also clears everything inside it, so nothing stays half-on
  const handleToggleAccess: ToggleAccess = (keys, on) =>
    setTree((prev) => updateAt(prev, keys, (n) => (on ? { ...n, isAccess: true } : setAll(n, false))));

  const handleToggleAction: ToggleAction = (keys, action, on) =>
    setTree((prev) => updateAt(prev, keys, (n) => ({ ...n, actions: { ...n.actions, [action]: on } })));

  const handleSave = async () => {
    if (!loaded || !catalog) return;
    setIsSaving(true);
    try {
      const res = await userRoleService.updateRolePermission(loaded.role, tree);
      const saved = normalize(catalog, res.permissionTree, res.locked);
      setLoaded({ ...loaded, original: saved });
      setTree(saved);
      toast.success(`Saved permissions for ${loaded.role}`);
      // The current user may hold this role: re-sync the sidebar and buttons right away
      void refreshPermissions();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  if (setupError) {
    return (
      <div className="py-8">
        <ServerErrorCard
          error={setupError}
          variant="inline"
          title="Failed to Load Permissions"
          onRetry={() => {
            setSetupError(null);
            setSetupAttempt((n) => n + 1);
          }}
        />
      </div>
    );
  }

  if (!catalog) return <Loader text="Loading permissions..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Role picker + save */}
      <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">Role</span>
          <Dropdown
            options={roleOptions}
            value={selectedRole}
            onChange={handleRoleChange}
            className="w-full sm:w-72 font-mono"
          />
        </div>

        {canSave && isTreeReady && !loaded?.locked && (
          <div className="flex items-center gap-2 shrink-0">
            {isDirty && (
              <Button
                variant="ghost"
                onClick={() => loaded && setTree(loaded.original)}
                disabled={isSaving}
                className="h-9 gap-1.5 px-3 rounded-lg"
              >
                <LuRotateCcw className="w-4 h-4" /> Discard
              </Button>
            )}
            <Button
              variant="brand"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex-1 sm:flex-none h-9 gap-1.5 px-4 rounded-lg"
            >
              {isSaving ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuSave className="w-4 h-4" />}
              {isDirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        )}
      </div>

      {treeError?.role === selectedRole ? (
        <ServerErrorCard
          error={treeError.error}
          variant="inline"
          title={`Failed to Load ${selectedRole} Permissions`}
          onRetry={() => {
            setTreeError(null);
            setTreeAttempt((n) => n + 1);
          }}
        />
      ) : !loaded || !isTreeReady ? (
        <div className="py-12">
          <Loader text={`Loading ${selectedRole} permissions...`} variant="inline" />
        </div>
      ) : (
        <>
          {(loaded.locked || !canSave) && (
            <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <LuLock className="w-4 h-4 shrink-0" aria-hidden />
              {loaded.locked
                ? "ADMIN always has full access, so it can't be changed."
                : "You can view these permissions but not change them."}
            </p>
          )}

          <ModuleGroup
            title="Admin panel"
            nodes={adminNodes}
            tree={tree}
            readOnly={readOnly}
            onToggleAccess={handleToggleAccess}
            onToggleAction={handleToggleAction}
          />
          <ModuleGroup
            title="Online store"
            nodes={storefrontNodes}
            tree={tree}
            readOnly={readOnly}
            onToggleAccess={handleToggleAccess}
            onToggleAction={handleToggleAction}
          />
        </>
      )}
    </div>
  );
}
