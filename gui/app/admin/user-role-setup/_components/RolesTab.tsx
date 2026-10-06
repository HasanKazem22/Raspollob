"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { LuShield } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { RowEditButton, RowDeleteButton } from "@/components/admin/RowActionButtons";
import { userRoleService } from "@/services/userRoleService";
import { RoleItem } from "@/types/userRole";
import { useAuth } from "@/context/AuthContext";
import { PERM } from "@/lib/permissions";

/** Built-in roles (mirrors PermissionCatalog.SYSTEM_ROLES): they can't be renamed or deleted. */
const SYSTEM_ROLES = ["ADMIN", "MANAGER", "CUSTOMER", "GUEST"];
const isSystemRole = (role: RoleItem) => SYSTEM_ROLES.includes(role.name);

export function RolesTab() {
  const { can } = useAuth();
  const canCreate = can(PERM.users.roles.create);
  const canUpdate = can(PERM.users.roles.update);
  const canDelete = can(PERM.users.roles.delete);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRoles(await userRoleService.getRoles());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "" });
    setShowRoleModal(true);
  };

  const handleOpenEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || "" });
    setShowRoleModal(true);
  };

  const handleSubmitRole = async () => {
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await userRoleService.updateRole(editingRole.id, roleForm);
        toast.success(`Role '${editingRole.name}' updated!`);
      } else {
        await userRoleService.createRole(roleForm);
        toast.success(`Role '${roleForm.name}' created!`);
      }
      setShowRoleModal(false);
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      await userRoleService.deleteRole(deletingRole.id);
      toast.success(`Role '${deletingRole.name}' deleted!`);
      setDeletingRole(null);
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete role.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<RoleItem>[] = [
    {
      header: "Role",
      className: "w-1/4",
      cell: (role) => (
        <span className="font-mono font-bold text-zinc-900 dark:text-white px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          {role.name}
        </span>
      ),
    },
    {
      header: "Description",
      className: "w-1/2",
      cell: (role) => (
        <span className="text-zinc-600 dark:text-zinc-300">{role.description || "No description provided."}</span>
      ),
    },
    {
      header: "Type",
      className: "w-36",
      cell: (role) =>
        isSystemRole(role) ? (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
            System Default
          </span>
        ) : (
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            Custom Role
          </span>
        ),
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (role) => (
        <div className="flex items-center justify-end gap-1.5">
          {canUpdate && <RowEditButton onClick={() => handleOpenEditModal(role)} title="Edit Role" />}
          {canDelete && !isSystemRole(role) && <RowDeleteButton onClick={() => setDeletingRole(role)} title="Delete Role" />}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={fetchRoles} variant="inline" title="Failed to Load Roles" />
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={roles}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search roles by name or description..."
        searchFilter={(r, query) =>
          r.name.toLowerCase().includes(query) || (r.description || "").toLowerCase().includes(query)
        }
        createButtonText="Create New Role"
        onCreateClick={canCreate ? handleOpenCreateModal : undefined}
        emptyTitle="No roles found"
        emptyDescription="No roles match your search or none have been created yet."
        emptyIcon={LuShield}
      />

      <Modal
        isOpen={showRoleModal}
        onOpenChange={setShowRoleModal}
        title={editingRole ? `Edit Role: ${editingRole.name}` : "Create New Role"}
        description="Roles group permissions. Configure what a role can do in Role Permission Setup."
        onSave={handleSubmitRole}
        saveText={editingRole ? "Update Role" : "Create Role"}
        isLoading={isSubmitting}
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Role Name" required>
            <Input
              placeholder="ROLE_SUPERVISOR"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              disabled={!!editingRole && isSystemRole(editingRole)}
              className="font-mono"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              rows={3}
              placeholder="Privileges and responsibilities..."
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
        title="Delete Role"
        message={
          <>
            Delete role <strong className="font-mono text-zinc-900 dark:text-white">{deletingRole?.name}</strong>?
            Users assigned to this role will lose its permissions.
          </>
        }
        confirmText="Delete Role"
        onConfirm={handleDeleteRole}
        isLoading={isDeleting}
      />
    </>
  );
}
