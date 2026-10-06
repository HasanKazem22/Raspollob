/**
 * Permission paths, mirroring the server's PermissionCatalog
 * (server/src/main/java/com/raspollob/server/security/PermissionCatalog.java).
 * Always use these constants instead of string literals so a typo can't silently hide a button.
 */
export const PERM = {
  storefront: {
    placeOrder: "storefront.actions.placeOrder",
    sendMessage: "storefront.actions.sendMessage",
  },
  dashboard: {
    access: "dashboard.isAccess",
  },
  home: {
    access: "home.isAccess",
    update: "home.actions.update",
  },
  order: {
    access: "order.isAccess",
    update: "order.actions.update",
    updatePayment: "order.actions.updatePayment",
    printSlip: "order.actions.printSlip",
    promoCodes: {
      access: "order.subModules.promoCodes.isAccess",
      create: "order.subModules.promoCodes.actions.create",
      update: "order.subModules.promoCodes.actions.update",
      delete: "order.subModules.promoCodes.actions.delete",
    },
  },
  message: {
    access: "contactMessage.isAccess",
    update: "contactMessage.actions.update",
  },
  product: {
    access: "product.isAccess",
    create: "product.actions.create",
    update: "product.actions.update",
    delete: "product.actions.delete",
    category: {
      access: "product.subModules.category.isAccess",
      create: "product.subModules.category.actions.create",
      update: "product.subModules.category.actions.update",
      delete: "product.subModules.category.actions.delete",
    },
  },
  users: {
    access: "userRoleSetup.isAccess",
    staff: {
      access: "userRoleSetup.subModules.systemUser.isAccess",
      create: "userRoleSetup.subModules.systemUser.actions.create",
      update: "userRoleSetup.subModules.systemUser.actions.update",
      delete: "userRoleSetup.subModules.systemUser.actions.delete",
    },
    customers: {
      access: "userRoleSetup.subModules.customerUser.isAccess",
      update: "userRoleSetup.subModules.customerUser.actions.update",
      delete: "userRoleSetup.subModules.customerUser.actions.delete",
    },
    roles: {
      access: "userRoleSetup.subModules.roleManagement.isAccess",
      create: "userRoleSetup.subModules.roleManagement.actions.create",
      update: "userRoleSetup.subModules.roleManagement.actions.update",
      delete: "userRoleSetup.subModules.roleManagement.actions.delete",
    },
    permissions: {
      access: "userRoleSetup.subModules.rolePermissionSetup.isAccess",
      update: "userRoleSetup.subModules.rolePermissionSetup.actions.update",
    },
  },
} as const;

/** Modules that belong to the admin panel (having any of them = staff). */
export const ADMIN_MODULE_KEYS = ["dashboard", "home", "order", "contactMessage", "product", "userRoleSetup"] as const;

export type PermissionTree = Record<string, unknown>;

/**
 * Resolves a dotted path the same way the server does: every module or sub-module passed on the
 * way must have isAccess=true, and unknown paths are denied.
 */
export function resolvePermission(tree: PermissionTree | null | undefined, path: string): boolean {
  if (!tree) return false;
  let current: unknown = tree;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") return false;
    const node = current as Record<string, unknown>;
    if ("isAccess" in node && part !== "isAccess" && node.isAccess !== true) return false;
    current = node[part];
  }
  return current === true;
}

// ─── Catalog (what the Role Permission screen renders) ────────────────────────

export type PermissionGroup = "STOREFRONT" | "ADMIN";

export interface PermissionAction {
  key: string;
  label: string;
}

export interface PermissionNode {
  key: string;
  label: string;
  description: string;
  group: PermissionGroup;
  actions: PermissionAction[];
  subModules: PermissionNode[];
}

/** Stored shape of one module / sub-module in a role's tree. */
export interface PermissionNodeValue {
  isAccess: boolean;
  actions: Record<string, boolean>;
  subModules: Record<string, PermissionNodeValue>;
}
