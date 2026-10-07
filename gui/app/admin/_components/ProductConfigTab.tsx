"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { LuPackage, LuFlame, LuStar } from "react-icons/lu";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { SegmentedTabs } from "@/components/ui/tabs";
import { Dropdown, DropdownOption } from "@/components/ui/dropdown";
import { MultiImageInput } from "@/components/ui/image-input";
import { StarRatingInput } from "@/components/ui/star-rating-input";
import { StatusSwitch, SwitchCard } from "@/components/ui/switch";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { PermissionGuard } from "@/components/PermissionGuard";
import { RowEditButton, RowDeleteButton } from "@/components/admin/RowActionButtons";
import { productService } from "@/services/productService";
import { categoryService, Category } from "@/services/categoryService";
import { uploadImage } from "@/services/fileService";
import { Product, ProductFormValues } from "@/types/product";
import { resolveMediaUrl } from "@/lib/api";
import { calcMargin, getCategoryName, getProductName } from "@/lib/product";
import { cn } from "@/lib/utils";
import { PERM } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";

type ProductFormTab = "general" | "pricing" | "media";

/** The table searches and pages in the browser, so it needs the whole catalogue */
const ADMIN_PRODUCT_LIMIT = 1000;

const SIZE_PRESETS = ["250 g", "500 g", "1 kg", "2 kg", "500 ml", "1 L"];

/** Number input with a ৳ prefix. */
function PriceInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">৳</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-7 font-semibold", className)}
      />
    </div>
  );
}

export function ProductConfigTab() {
  const { can } = useAuth();
  const canCreate = can(PERM.product.create);
  const canUpdate = can(PERM.product.update);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductFormTab>("general");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultForm = (): ProductFormValues => ({
    name: "",
    sku: "",
    sizeLabel: "",
    sizeOf: "",
    categoryId: categories.length > 0 ? categories[0].id : "",
    sellingPrice: "",
    buyingPrice: "",
    offerPrice: "",
    stockQuantity: 10,
    isTrending: false,
    isActive: true,
    averageRating: 5.0,
    reviewCount: null,
    description: "",
    details: "",
    ingredients: "",
    images: [],
  });

  const [formData, setFormData] = useState<ProductFormValues>(defaultForm());

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        categoryService.getCategories().catch(() => ({ data: [] })),
        productService.getAdminProducts(undefined, undefined, 0, ADMIN_PRODUCT_LIMIT).catch(() => productService.getProducts()),
      ]);
      setCategories(catsRes?.data || []);
      setProducts(prodsRes?.data?.content || prodsRes?.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshProducts = async () => {
    try {
      const res = await productService.getAdminProducts(undefined, undefined, 0, ADMIN_PRODUCT_LIMIT);
      setProducts(res?.data?.content || res?.data || []);
    } catch {
      // keep the current list; the next page load will catch up
    }
  };

  const categoryOptions: DropdownOption[] = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
        sublabel: cat.description ? `${cat.description.slice(0, 30)}...` : undefined,
      })),
    [categories]
  );

  /** Products that can be linked as other sizes (they need a size of their own) */
  const sameProductOptions: DropdownOption[] = useMemo(
    () => [
      { value: "", label: "Not linked" },
      ...products
        .filter((p) => p.id && p.id !== editingId && p.sizeLabel)
        .map((p) => ({ value: p.id!, label: getProductName(p), sublabel: getCategoryName(p) || undefined })),
    ],
    [products, editingId]
  );

  /** Picking a product on a new form fills any empty details from it, to save typing */
  const handleSameProductChange = (value: number | "") => {
    const source = value ? products.find((p) => p.id === value) : undefined;
    setFormData((prev) => {
      const next = { ...prev, sizeOf: value };
      if (!source || editingId) return next;
      return {
        ...next,
        name: prev.name || source.name || "",
        categoryId: prev.categoryId || categoryIdOf(source),
        description: prev.description || source.description || "",
        details: prev.details || source.details || "",
        ingredients: prev.ingredients || source.ingredients || "",
      };
    });
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setActiveTab("general");
    setFormData(defaultForm());
    setIsDialogOpen(true);
  };

  /** The category id of a product row, whatever shape the API returned it in. */
  const categoryIdOf = (prod: any): number | "" => {
    if (typeof prod.category === "object" && prod.category?.id) return prod.category.id;
    if (prod.categoryId) return prod.categoryId;
    if (typeof prod.category === "string") {
      return categories.find((c) => c.name.toLowerCase() === prod.category.toLowerCase())?.id ?? "";
    }
    return "";
  };

  const handleOpenEdit = (prod: any) => {
    setEditingId(prod.id || null);
    setActiveTab("general");

    const catId = categoryIdOf(prod);

    let imgs: ProductFormValues["images"] = [];
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      imgs = prod.images.map((img: any, idx: number) => ({
        id: img.id,
        imageUrl: typeof img === "string" ? img : img.imageUrl,
        isPrimary: typeof img === "object" ? !!img.isPrimary : idx === 0,
        displayOrder: typeof img === "object" && img.displayOrder !== undefined ? img.displayOrder : idx,
        altText: img.altText || prod.name,
      }));
    } else if (prod.primaryImageUrl || prod.imageUrl) {
      imgs = [{ imageUrl: prod.primaryImageUrl || prod.imageUrl, isPrimary: true, displayOrder: 0, altText: prod.name }];
    }

    setFormData({
      id: prod.id,
      name: prod.name || "",
      sku: prod.sku || "",
      sizeLabel: prod.sizeLabel || "",
      // Linked sizes share a group; pointing at any other member keeps the link
      sizeOf: prod.variantGroup
        ? products.find((p) => p.variantGroup === prod.variantGroup && p.id !== prod.id)?.id ?? ""
        : "",
      categoryId: catId,
      sellingPrice: prod.sellingPrice ?? prod.price ?? "",
      buyingPrice: prod.buyingPrice ?? "",
      offerPrice: prod.offerPrice ?? "",
      stockQuantity: prod.stockQuantity ?? 0,
      isTrending: !!prod.isTrending,
      isActive: prod.isActive ?? true,
      averageRating: prod.averageRating ?? prod.rating ?? 5.0,
      reviewCount: prod.reviewCount && prod.reviewCount > 0 ? prod.reviewCount : null,
      description: prod.description || "",
      details: prod.details || "",
      ingredients: prod.ingredients || "",
      images: imgs,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct?.id) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      toast.success(`"${getProductName(deletingProduct)}" deleted!`);
      if (deletingProduct.variantGroup) void refreshProducts();
      setDeletingProduct(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (prod: Product) => {
    if (!prod.id) return;
    const nextState = !prod.isActive;
    try {
      await productService.updateProduct(prod.id, { ...prod, isActive: nextState });
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, isActive: nextState } : p)));
      toast.success(`Product ${nextState ? "activated" : "deactivated"}.`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status.");
    }
  };

  const handleToggleTrending = async (prod: Product) => {
    if (!prod.id) return;
    const nextState = !prod.isTrending;
    try {
      await productService.toggleTrending(prod.id, nextState);
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, isTrending: nextState } : p)));
      toast.success(nextState ? "Product added to Home Trending!" : "Product removed from Trending.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update trending status.");
    }
  };

  const handleSave = async () => {
    const fail = (tab: ProductFormTab, message: string) => {
      setActiveTab(tab);
      toast.error(message);
    };
    if (!formData.name?.trim()) return fail("general", "Product name is required.");
    if (!formData.categoryId) return fail("general", "Please select a category.");
    if (formData.sizeOf && !formData.sizeLabel.trim()) {
      return fail("general", "Enter this product's size (for example 500 g) to link it with its other sizes.");
    }
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) return fail("pricing", "Selling price must be > 0.");
    if (formData.buyingPrice === "" || Number(formData.buyingPrice) < 0) return fail("pricing", "Buying price cannot be negative.");
    if (formData.offerPrice !== "" && Number(formData.offerPrice) > Number(formData.sellingPrice)) {
      return fail("pricing", "Offer price cannot be higher than regular selling price.");
    }
    if (formData.images.length < 2) return fail("media", `A product needs at least 2 images (currently ${formData.images.length}).`);
    if (formData.images.length > 5) return fail("media", "A product can have at most 5 images.");
    if (formData.images.some((img) => !img.imageUrl)) return fail("media", "Please wait for the images to finish uploading.");

    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        sku: formData.sku?.trim() || undefined,
        // "" clears the size; the server tidies "250g" into "250 g"
        sizeLabel: formData.sizeLabel.trim(),
        // Editing: 0 removes the link; creating: only sent when linked
        sizeOf: formData.sizeOf ? Number(formData.sizeOf) : editingId ? 0 : undefined,
        categoryId: Number(formData.categoryId),
        sellingPrice: Number(formData.sellingPrice),
        buyingPrice: Number(formData.buyingPrice),
        offerPrice: formData.offerPrice !== "" ? Number(formData.offerPrice) : null,
        stockQuantity: Number(formData.stockQuantity || 0),
        isTrending: formData.isTrending,
        isActive: formData.isActive,
        averageRating: Number(formData.averageRating || 5.0),
        reviewCount: formData.reviewCount !== null && formData.reviewCount !== undefined ? Number(formData.reviewCount) : null,
        description: formData.description.trim() || formData.name,
        details: formData.details.trim(),
        ingredients: formData.ingredients.trim(),
        // The full gallery in display order: the server keeps these, adds new ones and removes the rest
        imageUrls: formData.images.map((img) => img.imageUrl),
        primaryImageUrl: formData.images.find((img) => img.isPrimary)?.imageUrl,
      };

      const res = editingId
        ? await productService.updateProduct(editingId, payload)
        : await productService.createProduct(payload);
      const saved = res.data;
      toast.success(editingId ? `"${getProductName(saved)}" updated!` : `"${getProductName(saved)}" created!`);
      const wasLinked = !!products.find((p) => p.id === editingId)?.variantGroup;
      if (saved.variantGroup || wasLinked) {
        // Linking changes other rows too (their size picker)
        void refreshProducts();
      } else {
        setProducts((prev) => (editingId ? prev.map((p) => (p.id === editingId ? saved : p)) : [saved, ...prev]));
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  // Pricing & profit preview
  const sell = Number(formData.sellingPrice || 0);
  const buy = Number(formData.buyingPrice || 0);
  const offer = formData.offerPrice !== "" ? Number(formData.offerPrice) : null;
  const { profit, margin, isProfit } = calcMargin(sell, offer, buy);
  const discountPct = offer && sell > offer ? Math.round(((sell - offer) / sell) * 100) : 0;

  const searchFilter = (p: Product, query: string) => {
    const catStr = getCategoryName(p) || "";
    return (
      getProductName(p).toLowerCase().includes(query) ||
      catStr.toLowerCase().includes(query) ||
      (p.sku || "").toLowerCase().includes(query)
    );
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: "Product",
      className: "w-2/5",
      cell: (prod: any) => {
        const rawImg = prod.primaryImageUrl || (prod.images && prod.images[0]?.imageUrl) || prod.imageUrl || "";
        const primaryImg = resolveMediaUrl(rawImg);
        const catName = getCategoryName(prod);
        const imgCount = prod.images ? prod.images.length : rawImg ? 1 : 0;

        return (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
              {primaryImg ? (
                <img src={primaryImg} alt={getProductName(prod)} className="w-full h-full object-cover" />
              ) : (
                <LuPackage className="w-5 h-5 text-zinc-400" />
              )}
              {imgCount > 1 && (
                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                  {imgCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">{prod.name}</span>
                {prod.sizeLabel && (
                  <span className="text-[10px] font-bold bg-brand/10 text-brand-strong px-1.5 py-0.5 rounded">
                    {prod.sizeLabel}
                  </span>
                )}
                {prod.isTrending && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 rounded-full">
                    <LuFlame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Trending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {catName && <span className="text-brand font-semibold">{catName}</span>}
                {prod.sku && <span className="font-mono text-zinc-400">#{prod.sku}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Rating",
      className: "w-24 text-center",
      cellClassName: "text-center",
      cell: (prod: any) => (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/50 text-amber-700 text-xs font-bold">
          <LuStar className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{Number(prod.averageRating || prod.rating || 5.0).toFixed(1)}</span>
        </div>
      ),
    },
    {
      header: "Stock",
      className: "w-28",
      cell: (prod) => {
        const qty = prod.stockQuantity ?? 0;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                qty <= 0 ? "bg-red-500 animate-pulse" : qty <= 5 ? "bg-amber-500" : "bg-brand"
              }`}
            />
            <span className="text-xs font-semibold">{qty <= 0 ? "Out of Stock" : `${qty} in stock`}</span>
          </div>
        );
      },
    },
    {
      header: "Price",
      className: "w-32",
      cell: (prod: any) => {
        const sellPrice = Number(prod.sellingPrice ?? prod.price ?? 0);
        const offerPrice = prod.offerPrice ? Number(prod.offerPrice) : null;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              {offerPrice ? (
                <>
                  <span className="font-bold text-brand">৳ {offerPrice.toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-400 line-through">৳ {sellPrice.toLocaleString()}</span>
                </>
              ) : (
                <span className="font-bold text-zinc-900 dark:text-white">৳ {sellPrice.toLocaleString()}</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">
              Cost: ৳ {Number(prod.buyingPrice ?? 0).toLocaleString()}
            </div>
          </div>
        );
      },
    },
    {
      header: "Margin",
      className: "w-24",
      cell: (prod: any) => {
        const { profit: p, margin: m, isProfit: isProf } = calcMargin(
          Number(prod.sellingPrice ?? prod.price ?? 0),
          prod.offerPrice ? Number(prod.offerPrice) : null,
          Number(prod.buyingPrice ?? 0)
        );
        return (
          <div>
            <span className={`text-xs font-black ${isProf ? "text-brand" : "text-red-500"}`}>
              {isProf ? "+" : ""}
              {m}%
            </span>
            <div className="text-[10px] text-zinc-400">
              ৳ {Math.abs(p).toLocaleString()} {isProf ? "profit" : "loss"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Trending",
      className: "w-28",
      cell: (prod) => (
        <StatusSwitch checked={!!prod.isTrending} onChange={() => handleToggleTrending(prod)} disabled={!canUpdate} onLabel="Yes" offLabel="No" />
      ),
    },
    {
      header: "Status",
      className: "w-32",
      cell: (prod) => <StatusSwitch checked={prod.isActive !== false} onChange={() => handleToggleActive(prod)} disabled={!canUpdate} />,
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (prod) => (
        <div className="flex items-center justify-end gap-1.5">
          <PermissionGuard require={PERM.product.update} fallback={null}>
            <RowEditButton onClick={() => handleOpenEdit(prod)} title="Edit Product" />
          </PermissionGuard>
          <PermissionGuard require={PERM.product.delete} fallback={null}>
            <RowDeleteButton onClick={() => setDeletingProduct(prod)} title="Delete Product" />
          </PermissionGuard>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={loadData} variant="inline" title="Failed to Load Inventory" />
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search products by name, category, SKU..."
        searchFilter={searchFilter}
        createButtonText="Add Product"
        onCreateClick={canCreate ? handleOpenNew : undefined}
        emptyTitle="No products found"
        emptyDescription="No products match your search or none have been added to inventory yet."
        emptyIcon={LuPackage}
      />

      <Modal
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingId ? "Edit Product" : "New Product"}
        description="Configure product details, pricing, inventory, and images."
        onSave={handleSave}
        saveText={editingId ? "Save Changes" : "Create Product"}
        isLoading={isSaving}
        size="lg"
      >
        <div className="space-y-5">
          <SegmentedTabs
            fullWidth
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "general", label: "Basic Info" },
              { id: "pricing", label: "Pricing & Stock" },
              {
                id: "media",
                label: "Images & Features",
                badge: (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 rounded-full font-bold",
                      activeTab === "media"
                        ? "bg-white/20"
                        : formData.images.length >= 2
                          ? "bg-brand/15 text-brand"
                          : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {formData.images.length}/5
                  </span>
                ),
              },
            ]}
          />

          {/* ── Basic Info ── */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <FormField label="Product Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Premium Raw Sundarban Honey"
                  disabled={isSaving}
                />
              </FormField>

              <FormField
                label="Size"
                required={!!formData.sizeOf}
                optional={!formData.sizeOf}
                hint="Shown on the product card, e.g. 250 g. Leave empty if it's sold in one size."
              >
                <div className="space-y-2">
                  <Input
                    value={formData.sizeLabel}
                    onChange={(e) => setFormData({ ...formData, sizeLabel: e.target.value })}
                    placeholder="e.g. 500 g"
                    maxLength={40}
                    disabled={isSaving}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={isSaving}
                        onClick={() => setFormData({ ...formData, sizeLabel: preset })}
                        className={cn(
                          "h-6 px-2 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer",
                          formData.sizeLabel === preset
                            ? "border-brand bg-brand/10 text-brand-strong"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-brand"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>

              <FormField
                label="Same product as"
                optional
                hint="Sold in other sizes too? Pick one of them, and customers can switch size on the product page."
              >
                <Dropdown
                  options={sameProductOptions}
                  value={formData.sizeOf}
                  onChange={handleSameProductChange}
                  placeholder="Not linked"
                  searchable
                  searchPlaceholder="Search products..."
                  className="w-full"
                  disabled={isSaving}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category" required>
                  <Dropdown
                    options={categoryOptions}
                    value={formData.categoryId}
                    onChange={(val) => setFormData({ ...formData, categoryId: val })}
                    placeholder="Select category..."
                    className="w-full"
                    disabled={isSaving}
                  />
                </FormField>

                <FormField label="SKU / Code" optional>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. HONEY-500G"
                    disabled={isSaving}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <FormField label="Short Description">
                <Textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief synopsis for product cards and search results…"
                  disabled={isSaving}
                  className="resize-none"
                />
              </FormField>

              <FormField label="Ingredients">
                <Input
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="e.g. 100% Pure Wild Forest Honey"
                  disabled={isSaving}
                />
              </FormField>

              <FormField label="Details & Specifications">
                <Textarea
                  rows={2}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Detailed health benefits, sourcing background, or usage specifications…"
                  disabled={isSaving}
                  className="resize-none"
                />
              </FormField>
            </div>
          )}

          {/* ── Pricing & Stock ── */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Regular Price" required hint="Regular selling price">
                  <PriceInput
                    value={formData.sellingPrice}
                    onChange={(v) => setFormData({ ...formData, sellingPrice: v })}
                    placeholder="1050"
                    disabled={isSaving}
                  />
                </FormField>

                <FormField
                  label="Offer Price"
                  hint="Promotional price"
                  action={
                    discountPct > 0 && (
                      <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 rounded">
                        -{discountPct}%
                      </span>
                    )
                  }
                >
                  <PriceInput
                    value={formData.offerPrice}
                    onChange={(v) => setFormData({ ...formData, offerPrice: v })}
                    placeholder="850"
                    disabled={isSaving}
                    className="text-brand"
                  />
                </FormField>

                <FormField label="Buying Cost" required hint="Internal, not shown to customers">
                  <PriceInput
                    value={formData.buyingPrice}
                    onChange={(v) => setFormData({ ...formData, buyingPrice: v })}
                    placeholder="550"
                    disabled={isSaving}
                  />
                </FormField>
              </div>

              <FormField label="Stock Quantity" required className="w-48">
                <Input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: e.target.value ? Number(e.target.value) : "" })
                  }
                  placeholder="45"
                  disabled={isSaving}
                />
              </FormField>

              {sell > 0 && (
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-zinc-500 block">Estimated Unit Profit</span>
                    <div className={`text-base font-extrabold ${isProfit ? "text-brand" : "text-red-500"}`}>
                      {isProfit ? "+" : ""}৳ {profit.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] font-semibold text-zinc-500 block">Gross Margin</span>
                    <div className={`text-base font-extrabold ${isProfit ? "text-brand" : "text-red-500"}`}>
                      {margin}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Images & Features ── */}
          {activeTab === "media" && (
            <div className="space-y-5">
              <MultiImageInput
                value={formData.images}
                onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                onUpload={uploadImage}
                disabled={isSaving}
              />

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <SwitchCard
                  icon={<LuFlame className="w-4 h-4" />}
                  title="Feature on Home Trending"
                  description="Show this product in the homepage trending section"
                  checked={formData.isTrending}
                  onChange={(v) => setFormData({ ...formData, isTrending: v })}
                  disabled={isSaving}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Star Rating">
                    <StarRatingInput
                      value={formData.averageRating}
                      onChange={(val) => setFormData({ ...formData, averageRating: val })}
                      disabled={isSaving}
                    />
                  </FormField>

                  <FormField label="Reviews Count" optional>
                    <Input
                      type="number"
                      min="0"
                      value={formData.reviewCount ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewCount: e.target.value ? Number(e.target.value) : null })
                      }
                      placeholder="e.g. 120"
                      disabled={isSaving}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Delete Product"
        message={
          <>
            Delete <strong className="text-zinc-900 dark:text-white">{deletingProduct?.name}</strong>? Its image
            files will also be removed. This cannot be undone.
          </>
        }
        confirmText="Delete Product"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
