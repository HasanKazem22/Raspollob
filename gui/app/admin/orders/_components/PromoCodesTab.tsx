"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuTicket, LuCircleCheck } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedTabs } from "@/components/ui/tabs";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { StatusSwitch, SwitchCard } from "@/components/ui/switch";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { RowDeleteButton, RowEditButton } from "@/components/admin/RowActionButtons";
import { formatDateTime, formatTaka } from "@/lib/orders";
import type { DiscountType, PromoCode, PromoCodeInput } from "@/types/order";
import { PERM } from "@/lib/permissions";

interface PromoForm {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  isActive: boolean;
}

const EMPTY_FORM: PromoForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  perCustomerLimit: "1",
  isActive: true,
};

/** API datetime ("2026-10-05T10:00:00") → DateTimePicker value ("2026-10-05T10:00") */
const toInputDate = (iso?: string | null) => (iso ? iso.slice(0, 16) : "");
const toNumberOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

function toForm(p: PromoCode): PromoForm {
  return {
    code: p.code,
    description: p.description ?? "",
    discountType: p.discountType,
    discountValue: String(p.discountValue),
    maxDiscountAmount: p.maxDiscountAmount != null ? String(p.maxDiscountAmount) : "",
    minOrderAmount: p.minOrderAmount != null ? String(p.minOrderAmount) : "",
    startsAt: toInputDate(p.startsAt),
    expiresAt: toInputDate(p.expiresAt),
    usageLimit: p.usageLimit != null ? String(p.usageLimit) : "",
    perCustomerLimit: String(p.perCustomerLimit),
    isActive: p.isActive,
  };
}

function toInput(f: PromoForm): PromoCodeInput {
  return {
    code: f.code.trim().toUpperCase(),
    description: f.description.trim() || undefined,
    discountType: f.discountType,
    discountValue: Number(f.discountValue),
    maxDiscountAmount: f.discountType === "PERCENTAGE" ? toNumberOrNull(f.maxDiscountAmount) : null,
    minOrderAmount: toNumberOrNull(f.minOrderAmount),
    startsAt: f.startsAt || null,
    expiresAt: f.expiresAt || null,
    usageLimit: toNumberOrNull(f.usageLimit),
    perCustomerLimit: Number(f.perCustomerLimit || 1),
    isActive: f.isActive,
  };
}

function describeDiscount(p: Pick<PromoCode, "discountType" | "discountValue" | "maxDiscountAmount">) {
  if (p.discountType === "FIXED") return `${formatTaka(p.discountValue)} off`;
  return `${p.discountValue}% off${p.maxDiscountAmount ? ` (max ${formatTaka(p.maxDiscountAmount)})` : ""}`;
}

function validityLabel(p: PromoCode) {
  const now = Date.now();
  if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return { text: "Expired", tone: "text-red-600" };
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return { text: `Starts ${formatDateTime(p.startsAt)}`, tone: "text-amber-600" };
  return { text: p.expiresAt ? `Until ${formatDateTime(p.expiresAt)}` : "No expiry", tone: "text-zinc-500" };
}

export function PromoCodesTab() {
  const { can } = useAuth();
  const canCreate = can(PERM.order.promoCodes.create);
  const canUpdate = can(PERM.order.promoCodes.update);
  const canDelete = can(PERM.order.promoCodes.delete);

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [deleting, setDeleting] = useState<PromoCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPromos(await orderService.listPromoCodes());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (p: PromoCode) => {
    setEditing(p);
    setForm(toForm(p));
    setIsModalOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) return toast.error("Code is required.");
    if (!(Number(form.discountValue) > 0)) return toast.error("Discount value must be greater than 0.");
    if (form.discountType === "PERCENTAGE" && Number(form.discountValue) > 100) {
      return toast.error("A percentage discount can't be more than 100%.");
    }

    setIsSaving(true);
    try {
      const saved = editing
        ? await orderService.updatePromoCode(editing.id, toInput(form))
        : await orderService.createPromoCode(toInput(form));
      setPromos((prev) => (editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]));
      toast.success(editing ? "Promo code updated" : `Promo code ${saved.code} created`);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save promo code");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (p: PromoCode) => {
    try {
      const saved = await orderService.updatePromoCode(p.id, { ...toInput(toForm(p)), isActive: !p.isActive });
      setPromos((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      toast.success(`${saved.code} ${saved.isActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update promo code");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await orderService.deletePromoCode(deleting.id);
      setPromos((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success(`${deleting.code} deleted`);
      setDeleting(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete promo code");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<PromoCode>[] = [
    {
      header: "Code",
      cell: (p) => (
        <div>
          <span className="font-mono font-bold text-zinc-900 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">{p.code}</span>
          {p.description && <div className="text-[11px] text-zinc-400 mt-1 max-w-xs truncate">{p.description}</div>}
        </div>
      ),
    },
    {
      header: "Discount",
      className: "w-44",
      cell: (p) => (
        <div>
          <div className="font-bold text-brand-strong">{describeDiscount(p)}</div>
          {p.minOrderAmount ? <div className="text-[11px] text-zinc-400">Min. order {formatTaka(p.minOrderAmount)}</div> : null}
        </div>
      ),
    },
    {
      header: "Usage",
      className: "w-36",
      cell: (p) => (
        <div>
          <div className="font-semibold">
            {p.usedCount}
            {p.usageLimit ? ` / ${p.usageLimit}` : ""} used
          </div>
          <div className="text-[11px] text-zinc-400">{p.perCustomerLimit}× per customer</div>
        </div>
      ),
    },
    {
      header: "Validity",
      className: "w-44",
      cell: (p) => {
        const v = validityLabel(p);
        return <span className={`text-[11px] font-semibold ${v.tone}`}>{v.text}</span>;
      },
    },
    {
      header: "Status",
      className: "w-32",
      cell: (p) => <StatusSwitch checked={p.isActive} onChange={() => toggleActive(p)} disabled={!canUpdate} />,
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {canUpdate && <RowEditButton onClick={() => openEdit(p)} title="Edit Promo Code" />}
          {canDelete && <RowDeleteButton onClick={() => setDeleting(p)} title="Delete Promo Code" />}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={load} variant="inline" title="Failed to Load Promo Codes" />
      </div>
    );
  }

  const set = (field: keyof PromoForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <DataTable
        data={promos}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search promo codes..."
        searchFilter={(p, q) => p.code.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q)}
        createButtonText={canCreate ? "Create Promo Code" : undefined}
        onCreateClick={canCreate ? openCreate : undefined}
        emptyTitle="No promo codes yet"
        emptyDescription="Create a code customers can enter at checkout for a discount."
        emptyIcon={LuTicket}
      />

      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editing ? `Edit ${editing.code}` : "Create Promo Code"}
        description="One code can be used per order. Leave limits empty for no limit."
        onSave={save}
        saveText={editing ? "Save Changes" : "Create Code"}
        isLoading={isSaving}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Code" required hint="Letters, numbers, - and _">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                placeholder="EID25"
                maxLength={40}
                className="font-mono uppercase"
              />
            </FormField>
            <FormField label="Description" optional>
              <Input value={form.description} onChange={set("description")} placeholder="Eid campaign" />
            </FormField>
          </div>

          <FormField label="Discount Type">
            <SegmentedTabs
              fullWidth
              value={form.discountType}
              onChange={(t) => setForm({ ...form, discountType: t })}
              tabs={[
                { id: "PERCENTAGE", label: "Percentage (%)" },
                { id: "FIXED", label: "Fixed Amount (৳)" },
              ]}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={form.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (৳)"} required>
              <Input type="number" min="0" step="0.01" value={form.discountValue} onChange={set("discountValue")} placeholder={form.discountType === "PERCENTAGE" ? "15" : "100"} />
            </FormField>
            {form.discountType === "PERCENTAGE" ? (
              <FormField label="Max Discount (৳)" optional>
                <Input type="number" min="0" value={form.maxDiscountAmount} onChange={set("maxDiscountAmount")} placeholder="No cap" />
              </FormField>
            ) : (
              <div />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Min. Order (৳)" optional>
              <Input type="number" min="0" value={form.minOrderAmount} onChange={set("minOrderAmount")} placeholder="None" />
            </FormField>
            <FormField label="Total Uses" optional>
              <Input type="number" min="1" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" />
            </FormField>
            <FormField label="Per Customer" required>
              <Input type="number" min="1" value={form.perCustomerLimit} onChange={set("perCustomerLimit")} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Starts" optional>
              <DateTimePicker
                value={form.startsAt}
                onChange={(v) => setForm({ ...form, startsAt: v })}
                placeholder="Immediately"
                defaultTime="00:00"
              />
            </FormField>
            <FormField label="Expires" optional>
              <DateTimePicker
                value={form.expiresAt}
                onChange={(v) => setForm({ ...form, expiresAt: v })}
                placeholder="Never"
                defaultTime="23:55"
                min={form.startsAt || undefined}
              />
            </FormField>
          </div>

          <SwitchCard
            icon={<LuCircleCheck className="w-4 h-4" />}
            title="Active"
            description="Customers can use this code at checkout"
            checked={form.isActive}
            onChange={(v) => setForm({ ...form, isActive: v })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Promo Code"
        message={
          <>
            Delete <strong className="font-mono text-zinc-900">{deleting?.code}</strong>? Codes already used on orders
            can&apos;t be deleted — deactivate them instead.
          </>
        }
        confirmText="Delete Code"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
