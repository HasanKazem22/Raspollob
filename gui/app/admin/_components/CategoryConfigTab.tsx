"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { LuLayoutGrid, LuCompass, LuHouse, LuPackage, LuLayers } from "react-icons/lu";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { ImageInput } from "@/components/ui/image-input";
import { StatusSwitch, SwitchCard } from "@/components/ui/switch";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { RowEditButton, RowDeleteButton } from "@/components/admin/RowActionButtons";
import { categoryService, Category } from "@/services/categoryService";
import { uploadImage } from "@/services/fileService";
import { resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PERM } from "@/lib/permissions";

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const defaultForm = () => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  displayOrder: "" as number | "",
  showInNavbar: false,
  showInHome: true,
  isActive: true,
});

export function CategoryConfigTab() {
  const { can } = useAuth();
  const canCreate = can(PERM.product.category.create);
  const canUpdate = can(PERM.product.category.update);
  const canDelete = can(PERM.product.category.delete);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(defaultForm());

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await categoryService.getAdminCategories();
      setCategories(res.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(defaultForm());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      displayOrder: cat.displayOrder ?? "",
      showInNavbar: !!cat.showInNavbar,
      showInHome: !!cat.showInHome,
      isActive: cat.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return toast.error("Category name is required.");
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      description: formData.description.trim(),
      // Empty string clears the thumbnail on update
      imageUrl: formData.imageUrl.trim(),
      displayOrder: Number(formData.displayOrder || 0),
      showInNavbar: formData.showInNavbar,
      showInHome: formData.showInHome,
      isActive: formData.isActive,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        const res = await categoryService.updateCategory(editingId, payload);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data : c)));
        toast.success("Category updated successfully!");
      } else {
        const res = await categoryService.createCategory(payload);
        setCategories((prev) => [...prev, res.data]);
        toast.success("Category created successfully!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      toast.success(`Category "${deletingCategory.name}" deleted!`);
      setDeletingCategory(null);
    } catch (err: any) {
      toast.error(err?.message || "Cannot delete category with associated products.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleNavbar = async (cat: Category) => {
    const next = !cat.showInNavbar;
    try {
      await categoryService.toggleNavbar(cat.id, next);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, showInNavbar: next } : c)));
      toast.success(next ? `"${cat.name}" added to Navbar navigation.` : `"${cat.name}" removed from Navbar.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update navbar setting.");
    }
  };

  const handleToggleHome = async (cat: Category) => {
    const next = !cat.showInHome;
    try {
      await categoryService.toggleHome(cat.id, next);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, showInHome: next } : c)));
      toast.success(next ? `"${cat.name}" added to Home 'Shop by Category'.` : `"${cat.name}" hidden from Home.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update home setting.");
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      header: "Category",
      className: "w-2/5",
      cell: (cat) => {
        const preview = cat.imageUrl ? resolveMediaUrl(cat.imageUrl) : "";
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
              {preview ? (
                <img src={preview} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <LuLayers className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">{cat.name}</div>
              <div className="font-mono text-[11px] text-zinc-400">/{cat.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Products",
      className: "w-28 text-center",
      cellClassName: "text-center",
      cell: (cat) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <LuPackage className="w-3 h-3 text-zinc-400" />
          {cat.productCount ?? 0}
        </span>
      ),
    },
    {
      header: "Order",
      className: "w-24 text-center",
      cellClassName: "text-center",
      cell: (cat) => (
        <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          #{cat.displayOrder ?? 0}
        </span>
      ),
    },
    {
      header: "Navbar",
      className: "w-32",
      cell: (cat) => (
        <StatusSwitch
          checked={!!cat.showInNavbar}
          onChange={() => handleToggleNavbar(cat)}
          disabled={!canUpdate}
          onLabel="Visible"
          offLabel="Hidden"
        />
      ),
    },
    {
      header: "Homepage",
      className: "w-32",
      cell: (cat) => (
        <StatusSwitch
          checked={!!cat.showInHome}
          onChange={() => handleToggleHome(cat)}
          disabled={!canUpdate}
          onLabel="Visible"
          offLabel="Hidden"
        />
      ),
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          {canUpdate && <RowEditButton onClick={() => handleOpenEdit(cat)} title="Edit Category" />}
          {canDelete && <RowDeleteButton onClick={() => setDeletingCategory(cat)} title="Delete Category" />}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={loadCategories} variant="inline" title="Failed to Load Categories" />
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={categories}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search categories by name, slug..."
        searchFilter={(c, query) =>
          c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)
        }
        createButtonText="Add Category"
        onCreateClick={canCreate ? handleOpenNew : undefined}
        emptyTitle="No categories found"
        emptyDescription="Create your first category to group inventory and showcase on the homepage."
        emptyIcon={LuLayoutGrid}
      />

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? "Edit Category" : "New Category"}
        description="Configure category details, display settings for Home and Navbar, and thumbnail image."
        onSave={handleSave}
        saveText={editingId ? "Save Changes" : "Create Category"}
        isLoading={isSaving}
      >
        <div className="space-y-4">
          <FormField label="Category Name" required>
            <Input
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                // Keep the slug in sync until the user edits it by hand
                const followsName = !formData.slug || formData.slug === slugify(formData.name);
                setFormData({ ...formData, name, slug: followsName ? slugify(name) : formData.slug });
              }}
              placeholder="e.g. Natural Raw Honey"
              disabled={isSaving}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="URL Slug" optional>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated-from-name"
                disabled={isSaving}
                className="font-mono"
              />
            </FormField>

            <FormField label="Display Order">
              <Input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: e.target.value === "" ? "" : Number(e.target.value) })
                }
                placeholder="1"
                disabled={isSaving}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description for category cards and SEO…"
              disabled={isSaving}
              className="resize-none"
            />
          </FormField>

          <FormField label="Thumbnail Image">
            <ImageInput
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              onRemove={() => setFormData({ ...formData, imageUrl: "" })}
              onUpload={uploadImage}
              variant="card"
              size="sm"
              disabled={isSaving}
            />
          </FormField>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <SwitchCard
              icon={<LuCompass className="w-4 h-4" />}
              title="Show in Navbar"
              description="Feature this category in the website header menu"
              checked={formData.showInNavbar}
              onChange={(v) => setFormData({ ...formData, showInNavbar: v })}
              disabled={isSaving}
            />
            <SwitchCard
              icon={<LuHouse className="w-4 h-4" />}
              title="Show on Homepage"
              description={`Display in the homepage "Shop by Category" section`}
              checked={formData.showInHome}
              onChange={(v) => setFormData({ ...formData, showInHome: v })}
              disabled={isSaving}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete Category"
        message={
          <>
            Delete category <strong className="text-zinc-900 dark:text-white">{deletingCategory?.name}</strong>?
            Categories that still contain products cannot be deleted.
          </>
        }
        confirmText="Delete Category"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
