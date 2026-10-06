export interface RoleItem {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemUserItem {
  id: number;
  fullName?: string;
  username: string;
  email?: string;
  mobile?: string;
  isActive: boolean;
  createdAt?: string;
  roles?: RoleItem[];
}

export interface CustomerUserItem {
  id: number;
  fullName?: string;
  username: string;
  email?: string;
  mobile?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  isActive: boolean;
  createdAt?: string;
  roles?: RoleItem[];
}

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
  postalCode?: string;
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
