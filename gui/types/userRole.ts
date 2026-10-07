export interface RoleItem {
  id: number;
  name: string;
  description?: string;
  /** ADMIN, MANAGER, CUSTOMER, GUEST: can't be renamed or deleted */
  builtIn?: boolean;
  /** Can be picked for a staff account (false for CUSTOMER and GUEST) */
  staffAssignable?: boolean;
  createdAt?: string;
}

/** A role as listed on an account */
export interface RoleRef {
  id: number;
  name: string;
}

/** An account from GET /admin/users (never includes the password) */
interface AdminUser {
  id: number;
  fullName?: string;
  username: string;
  email?: string;
  mobile?: string;
  city?: string;
  address?: string;
  isActive: boolean;
  /** True for staff accounts (any role other than Customer) */
  staff?: boolean;
  createdAt?: string;
  roles?: RoleRef[];
}

export type SystemUserItem = AdminUser;

export type CustomerUserItem = AdminUser;

export interface AdminUserForm {
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  password?: string;
  roleIds: number[];
}

export interface CustomerUserForm {
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  address?: string;
  city?: string;
  password?: string;
}

export interface CreateRoleForm {
  name: string;
  description?: string;
}

export interface RolePermissionItem {
  roleName: string;
  permissionTree: Record<string, any>;
  /** ADMIN always has every permission and can't be edited */
  locked: boolean;
}
