"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { LuUserCheck, LuMapPin } from "react-icons/lu";
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
import { CustomerUserItem } from "@/types/userRole";
import { PERM } from "@/lib/permissions";

export function CustomerUsersTab() {
  const { can } = useAuth();
  const canUpdate = can(PERM.users.customers.update);
  const canDelete = can(PERM.users.customers.delete);

  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [editingCustomer, setEditingCustomer] = useState<CustomerUserItem | null>(null);
  const [customerForm, setCustomerForm] = useState({
    fullName: "",
    username: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingCustomer, setDeletingCustomer] = useState<CustomerUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCustomers(await userRoleService.getCustomers());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenEdit = (customer: CustomerUserItem) => {
    setEditingCustomer(customer);
    setCustomerForm({
      fullName: customer.fullName || "",
      username: customer.username,
      email: customer.email || "",
      mobile: customer.mobile || "",
      address: customer.address || "",
      city: customer.city || "",
      password: "",
    });
  };

  const handleToggleStatus = async (user: CustomerUserItem) => {
    const nextStatus = !user.isActive;
    try {
      await userRoleService.toggleCustomerStatus(user.id, nextStatus);
      setCustomers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u)));
      toast.success(`Customer '${user.username}' is now ${nextStatus ? "Active" : "Blocked"}.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update customer status.");
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingCustomer) return;
    if (!isValidBdPhone(customerForm.mobile)) {
      toast.error(BD_PHONE_ERROR);
      return;
    }
    setIsSubmitting(true);
    try {
      await userRoleService.updateCustomer(editingCustomer.id, customerForm);
      toast.success(`Customer account '${customerForm.username}' updated!`);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update customer account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await userRoleService.deleteCustomer(deletingCustomer.id);
      toast.success(`Customer account '@${deletingCustomer.username}' deleted!`);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete customer account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<CustomerUserItem>[] = [
    {
      header: "Customer",
      className: "w-1/4",
      cell: (customer) => (
        <div>
          <div className="font-bold text-sm text-zinc-900 dark:text-white">{customer.fullName || customer.username}</div>
          <div className="text-[11px] font-mono text-zinc-400">@{customer.username}</div>
        </div>
      ),
    },
    {
      header: "Contact",
      className: "w-1/4",
      cell: (customer) => (
        <div className="text-zinc-600 dark:text-zinc-300">
          <div>{customer.email || "N/A"}</div>
          <div className="text-[11px] text-zinc-400">{customer.mobile || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Location",
      className: "w-1/4",
      cell: (customer) => (
        <div className="text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1">
            <LuMapPin className="w-3 h-3 text-zinc-400" />
            <span>{customer.city || "N/A"}</span>
          </div>
          {customer.address && <div className="text-[11px] text-zinc-400 truncate max-w-xs">{customer.address}</div>}
        </div>
      ),
    },
    {
      header: "Status",
      className: "w-32",
      cell: (customer) => (
        <StatusSwitch
          checked={customer.isActive}
          onChange={() => handleToggleStatus(customer)}
          disabled={!canUpdate}
          offLabel="Blocked"
        />
      ),
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (customer) => (
        <div className="flex items-center justify-end gap-1.5">
          {canUpdate && <RowEditButton onClick={() => handleOpenEdit(customer)} title="Edit Customer" />}
          {canDelete && <RowDeleteButton onClick={() => setDeletingCustomer(customer)} title="Delete Customer" />}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={fetchCustomers} variant="inline" title="Failed to Load Customer Accounts" />
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={customers}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search customers by name, username, city..."
        searchFilter={(c, query) =>
          (c.fullName || "").toLowerCase().includes(query) ||
          (c.username || "").toLowerCase().includes(query) ||
          (c.email || "").toLowerCase().includes(query) ||
          (c.mobile || "").includes(query) ||
          (c.city || "").toLowerCase().includes(query)
        }
        emptyTitle="No customer accounts found"
        emptyDescription="No registered customer accounts exist."
        emptyIcon={LuUserCheck}
      />

      <Modal
        isOpen={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
        title={`Edit Customer: @${editingCustomer?.username ?? ""}`}
        description="Update the customer's profile and shipping details."
        onSave={handleSubmitEdit}
        saveText="Save Changes"
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              value={customerForm.fullName}
              onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Username" required>
              <Input
                value={customerForm.username}
                onChange={(e) => setCustomerForm({ ...customerForm, username: e.target.value })}
              />
            </FormField>
            <FormField label="New Password" optional>
              <Input
                type="password"
                placeholder="••••••••"
                value={customerForm.password}
                onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email Address" required>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              />
            </FormField>
            <FormField label="Mobile Number" required>
              <PhoneInput
                value={customerForm.mobile}
                onChange={(mobile) => setCustomerForm({ ...customerForm, mobile })}
              />
            </FormField>
          </div>

          <FormField label="City / Region">
            <Input
              placeholder="e.g. Dhaka"
              value={customerForm.city}
              onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
            />
          </FormField>

          <FormField label="Shipping Address">
            <Input
              placeholder="House #, Street, Area..."
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title="Delete Customer Account"
        message={
          <>
            Permanently delete customer account{" "}
            <strong className="text-zinc-900 dark:text-white font-mono">@{deletingCustomer?.username}</strong>? This
            cannot be undone.
          </>
        }
        confirmText="Delete Customer"
        onConfirm={handleDeleteCustomer}
        isLoading={isDeleting}
      />
    </>
  );
}
