import { apiFetch } from "@/lib/api";
import {
  SystemUserItem,
  CustomerUserItem,
  RoleItem,
  AdminUserForm,
  CustomerUserForm,
  CreateRoleForm,
  RolePermissionItem,
} from "@/types/userRole";
import type { PermissionNode } from "@/lib/permissions";

const unwrap = (res: any) => {
  if (res && res.success === false) {
    throw new Error(res.message || "API request failed");
  }
  return res && res.success !== undefined ? res.data : res;
};

// System users and customers share the same /admin/users endpoints;
// they are only told apart by role on the client.
const fetchAllUsers = async (): Promise<any[]> => {
  const res = await apiFetch("/admin/users").then(unwrap);
  return Array.isArray(res) ? res : res?.content || [];
};

const updateUser = async (id: number, form: AdminUserForm | CustomerUserForm) =>
  apiFetch(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(form),
  }).then(unwrap);

const setUserStatus = async (id: number, isActive: boolean) =>
  apiFetch(`/admin/users/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  }).then(unwrap);

const deleteUser = async (id: number): Promise<void> =>
  apiFetch(`/admin/users/${id}`, {
    method: "DELETE",
  }).then(unwrap);

export const userRoleService = {
  // --- System Users ---
  getSystemUsers: async (): Promise<SystemUserItem[]> => {
    const list = await fetchAllUsers();
    return list.filter((u: SystemUserItem) =>
      u.roles?.some((r) => r.name !== "CUSTOMER") || u.roles?.length === 0
    );
  },

  createSystemUser: async (form: AdminUserForm): Promise<SystemUserItem> => {
    return apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify(form),
    }).then(unwrap);
  },

  updateSystemUser: (id: number, form: AdminUserForm): Promise<SystemUserItem> => updateUser(id, form),
  toggleUserStatus: (id: number, isActive: boolean): Promise<SystemUserItem> => setUserStatus(id, isActive),
  deleteSystemUser: deleteUser,

  // --- Customers ---
  getCustomers: async (): Promise<CustomerUserItem[]> => {
    const list = await fetchAllUsers();
    return list.filter((u: CustomerUserItem) =>
      u.roles?.some((r) => r.name === "CUSTOMER")
    );
  },

  updateCustomer: (id: number, form: CustomerUserForm): Promise<CustomerUserItem> => updateUser(id, form),
  toggleCustomerStatus: (id: number, isActive: boolean): Promise<CustomerUserItem> => setUserStatus(id, isActive),
  deleteCustomer: deleteUser,

  // --- Roles ---
  getRoles: async (): Promise<RoleItem[]> => {
    const res = await apiFetch("/admin/roles").then(unwrap);
    return Array.isArray(res) ? res : res?.content || [];
  },

  createRole: async (form: CreateRoleForm): Promise<RoleItem> => {
    return apiFetch("/admin/roles", {
      method: "POST",
      body: JSON.stringify(form),
    }).then(unwrap);
  },

  updateRole: async (id: number, form: CreateRoleForm): Promise<RoleItem> => {
    return apiFetch(`/admin/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(form),
    }).then(unwrap);
  },

  deleteRole: async (id: number): Promise<void> => {
    return apiFetch(`/admin/roles/${id}`, {
      method: "DELETE",
    }).then(unwrap);
  },

  // --- Role Permission Tree ---
  /** Everything that can be permitted, straight from the server's PermissionCatalog. */
  getPermissionCatalog: async (): Promise<PermissionNode[]> => {
    return apiFetch("/admin/role-permissions/catalog").then(unwrap);
  },

  getRolePermission: async (roleName: string): Promise<RolePermissionItem> => {
    return apiFetch(`/admin/role-permissions/${encodeURIComponent(roleName)}`).then(unwrap);
  },

  updateRolePermission: async (roleName: string, permissionTree: Record<string, any>): Promise<RolePermissionItem> => {
    return apiFetch(`/admin/role-permissions/${encodeURIComponent(roleName)}`, {
      method: "PUT",
      body: JSON.stringify(permissionTree),
    }).then(unwrap);
  },
};
