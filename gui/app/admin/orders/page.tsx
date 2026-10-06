"use client";

import { useState } from "react";
import { LuShoppingBag, LuTicket } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { AdminPage, AdminPageTabs } from "@/components/admin/AdminPage";
import { OrdersTab } from "./_components/OrdersTab";
import { PromoCodesTab } from "./_components/PromoCodesTab";
import { PERM } from "@/lib/permissions";

type OrdersPageTab = "orders" | "promoCodes";

export default function AdminOrdersPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<OrdersPageTab>("orders");
  const canManagePromos = can(PERM.order.promoCodes.access);

  return (
    <AdminPage
      icon={LuShoppingBag}
      title="Orders"
      description="Review new orders, verify payments, update delivery status and print delivery slips."
      permission={PERM.order.access}
      deniedDescription="You do not have permission to view or manage orders."
    >
      {canManagePromos && (
        <AdminPageTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "orders", label: "Orders", icon: LuShoppingBag },
            { id: "promoCodes", label: "Promo Codes", icon: LuTicket },
          ]}
        />
      )}

      {activeTab === "orders" || !canManagePromos ? <OrdersTab /> : <PromoCodesTab />}
    </AdminPage>
  );
}
