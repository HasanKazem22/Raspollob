"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { LuUsers } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_PHONE_ERROR, isValidBdPhone } from "@/lib/phone";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { StatusSwitch } from "@/components/ui/switch";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { RowEditButton, RowDeleteButton } from "@/components/admin/RowActionButtons";
import { useAuth } from "@/context/AuthContext";
import { userRoleService } from "@/services/userRoleService";
import { SystemUserItem, RoleItem } from "@/types/userRole";
import { PERM } from "@/lib/permissions";

const emptyForm = { fullName: "", username: "", email: "", mobile: "", password: "", roleIds: [] as number[] };

export function SystemUsersTab() {
  const { can } = useAuth();
  const canCreate = can(PERM.users.staff.create);
  const canUpdate = can(PERM.users.staff.update);
  const canDelete = can(PERM.users.staff.delete);

  const [users, setUsers] = useState<SystemUserItem[]>([]);
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUserItem | null>(null);
  const [userForm, setUserForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingUser, setDeletingUser] = useState<SystemUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [systemUsers, rolesData] = await Promise.all([
        userRoleService.getSystemUsers(),
        userRoleService.getRoles(),
      ]);
      setUsers(systemUsers);
      setRolesList(rolesData);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUserForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (user: SystemUserItem) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName || "",
      username: user.username,
      email: user.email || "",
      mobile: user.mobile || "",
      password: "",
      roleIds: user.roles?.map((r) => r.id) || [],
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (user: SystemUserItem) => {
    const nextStatus = !user.isActive;
    try {
      await userRoleService.toggleUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u)));
      toast.success(`User '${user.username}' is now ${nextStatus ? "Active" : "Inactive"}.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle user status.");
    }
  };

  const handleSubmit = async () => {
    if (!isValidBdPhone(userForm.mobile)) {
      toast.error(BD_PHONE_ERROR);
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await userRoleService.updateSystemUser(editingUser.id, userForm);
        toast.success(`User account '${userForm.username}' updated!`);
      } else {
        await userRoleService.createSystemUser(userForm);
        toast.success(`System user '${userForm.username}' created!`);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await userRoleService.deleteSystemUser(deletingUser.id);
      toast.success(`System user '@${deletingUser.username}' deleted!`);
      setDeletingUser(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete system user.");
    } finally {
      setIsDeleting(false);
    }
  };

  /** Only roles a staff account can have (the server marks Customer and Guest as not assignable) */
  const staffRoles = rolesList.filter((r) => r.staffAssignable);

  const toggleRole = (roleId: number, checked: boolean) =>
    setUserForm({
      ...userForm,
      roleIds: checked ? [...userForm.roleIds, roleId] : userForm.roleIds.filter((id) => id !== roleId),
    });

  const columns: ColumnDef<SystemUserItem>[] = [
    {
      header: "User",
      className: "w-1/4",
      cell: (user) => (
        <div>
          <div className="font-bold text-sm text-zinc-900 dark:text-white">{user.fullName || user.username}</div>
          <div className="text-[11px] font-mono text-zinc-400">@{user.username}</div>
        </div>
      ),
    },
    {
      header: "Contact",
      className: "w-1/4",
      cell: (user) => (
        <div className="text-zinc-600 dark:text-zinc-300">
          <div>{user.email || "N/A"}</div>
          <div className="text-[11px] text-zinc-400">{user.mobile || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Roles",
      className: "w-1/4",
      cell: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((r) => (
              <span
                key={r.id}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
              >
                {r.name}
              </span>
            ))
          ) : (
            <span className="text-zinc-400 italic">No Roles</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      className: "w-32",
      cell: (user) => (
        <StatusSwitch checked={user.isActive} onChange={() => handleToggleStatus(user)} disabled={!canUpdate} />
      ),
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (user) => (
        <div className="flex items-center justify-end gap-1.5">
          {canUpdate && <RowEditButton onClick={() => handleOpenEdit(user)} title="Edit User" />}
          {canDelete && <RowDeleteButton onClick={() => setDeletingUser(user)} title="Delete User" />}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={fetchData} variant="inline" title="Failed to Load System Users" />
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search system users by name, username, email..."
        searchFilter={(u, query) =>
          (u.fullName || "").toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.mobile || "").includes(query)
        }
        createButtonText={canCreate ? "Create System User" : undefined}
        onCreateClick={canCreate ? handleOpenCreate : undefined}
        emptyTitle="No system users found"
        emptyDescription="No system accounts match your search or none have been created yet."
        emptyIcon={LuUsers}
      />

      <Modal
        isOpen={showModal}
        onOpenChange={setShowModal}
        title={editingUser ? `Edit System User: @${editingUser.username}` : "Create System User"}
        description="Staff accounts that can sign in to the admin panel."
        onSave={handleSubmit}
        saveText={editingUser ? "Update User" : "Create User"}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              placeholder="e.g. Hasibul Hasan"
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Username" required>
              <Input
                placeholder="admin_hasan"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
            </FormField>
            <FormField label="Password" required={!editingUser} optional={!!editingUser}>
              <Input
                type="password"
                placeholder="••••••••"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email Address" required>
              <Input
                type="email"
                placeholder="hasan@example.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </FormField>
            <FormField label="Mobile Number" required>
              <PhoneInput
                value={userForm.mobile}
                onChange={(mobile) => setUserForm({ ...userForm, mobile })}
              />
            </FormField>
          </div>

          <FormField
            label="Assigned Roles"
            required
            hint="Customer and Guest aren't listed: customers sign up themselves, and Guest is for visitors who aren't signed in."
          >
            <div className="space-y-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 max-h-36 overflow-y-auto">
              {staffRoles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                  <input
                    type="checkbox"
                    checked={userForm.roleIds.includes(r.id)}
                    onChange={(e) => toggleRole(r.id, e.target.checked)}
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span className="font-semibold text-zinc-900 dark:text-white">{r.name}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Delete System User"
        message={
          <>
            Permanently delete system user{" "}
            <strong className="text-zinc-900 dark:text-white font-mono">@{deletingUser?.username}</strong>? This
            cannot be undone.
          </>
        }
        confirmText="Delete User"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />
    </>
  );
}
