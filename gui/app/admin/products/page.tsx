"use client";

import { useState } from "react";
import { LuPackage, LuLayers } from "react-icons/lu";
import { AdminPage, AdminPageTabs } from "@/components/admin/AdminPage";
import { ProductConfigTab } from "../_components/ProductConfigTab";
import { CategoryConfigTab } from "../_components/CategoryConfigTab";
import { useAuth } from "@/context/AuthContext";
import { TabItem } from "@/components/ui/tabs";
import { PERM } from "@/lib/permissions";

type ProductsTab = "products" | "categories";

const TABS: (TabItem<ProductsTab> & { permission: string })[] = [
  { id: "products", label: "Products Inventory", icon: LuPackage, permission: PERM.product.access },
  { id: "categories", label: "Categories & Navigation", icon: LuLayers, permission: PERM.product.category.access },
];

export default function ProductsPage() {
  const { can } = useAuth();
  const tabs = TABS.filter((t) => can(t.permission));
  const [selectedTab, setActiveTab] = useState<ProductsTab | null>(null);
  const activeTab = tabs.some((t) => t.id === selectedTab) ? selectedTab : tabs[0]?.id;

  return (
    <AdminPage
      icon={LuPackage}
      title="Products & Categories Management"
      description="Manage your product inventory, stock levels, categories, and configure what appears on the homepage and header navbar."
      permission={PERM.product.access}
      deniedDescription="You do not have permission to view or manage product inventory."
    >
      {tabs.length > 1 && activeTab && <AdminPageTabs value={activeTab} onChange={setActiveTab} tabs={tabs} />}

      {activeTab === "products" && <ProductConfigTab />}
      {activeTab === "categories" && <CategoryConfigTab />}
    </AdminPage>
  );
}
