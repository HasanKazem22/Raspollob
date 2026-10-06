"use client";

import { LuHouse } from "react-icons/lu";
import { AdminPage } from "@/components/admin/AdminPage";
import { HomeConfigTab } from "../_components/HomeConfigTab";
import { PERM } from "@/lib/permissions";

export default function HomeSettingsPage() {
  return (
    <AdminPage
      icon={LuHouse}
      title="Home Page Management"
      description="Select a section below to configure your homepage banners, customer reviews, and footer information."
      permission={PERM.home.access}
      deniedDescription="You do not have permission to view or configure landing page settings."
    >
      <HomeConfigTab />
    </AdminPage>
  );
}
