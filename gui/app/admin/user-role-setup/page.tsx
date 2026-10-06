"use client";

import { useState } from "react";
import { LuUsers, LuUserCheck, LuShield, LuSlidersHorizontal } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { AdminPage, AdminPageTabs } from "@/components/admin/AdminPage";
import { TabItem } from "@/components/ui/tabs";
import { SystemUsersTab } from "./_components/SystemUsersTab";
import { CustomerUsersTab } from "./_components/CustomerUsersTab";
import { RolesTab } from "./_components/RolesTab";
import { RolePermissionSetupTab } from "./_components/RolePermissionSetupTab";
import { PERM } from "@/lib/permissions";

type UserRoleTab = "system" | "customers" | "roles" | "permissionSetup";

const TABS: (TabItem<UserRoleTab> & { permission: string })[] = [
  { id: "system", label: "System Users", icon: LuUsers, permission: PERM.users.staff.access },
  { id: "customers", label: "Customer Users", icon: LuUserCheck, permission: PERM.users.customers.access },
  { id: "roles", label: "Roles Management", icon: LuShield, permission: PERM.users.roles.access },
  { id: "permissionSetup", label: "Role Permission Setup", icon: LuSlidersHorizontal, permission: PERM.users.permissions.access },
];

export default function UserRoleSetupPage() {
  const { can } = useAuth();
  const tabs = TABS.filter((t) => can(t.permission));
  const [selectedTab, setActiveTab] = useState<UserRoleTab | null>(null);
  // Fall back to the first tab this role may open
  const activeTab = tabs.some((t) => t.id === selectedTab) ? selectedTab : tabs[0]?.id;

  return (
    <AdminPage
      icon={LuShield}
      title="User & Role Security Control Hub"
      description="Manage system administrators, customer accounts, role definitions, and dynamic permission trees."
      permission={PERM.users.access}
      deniedDescription="You do not have permission to manage user accounts, roles, or permission trees."
    >
      {activeTab ? (
        <AdminPageTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
      ) : (
        <p className="py-12 text-center text-sm text-zinc-500">
          Your role can open this page but has no sections enabled. Ask an administrator to enable one.
        </p>
      )}

      <div className="animate-in fade-in duration-150">
        {activeTab === "system" && <SystemUsersTab />}
        {activeTab === "customers" && <CustomerUsersTab />}
        {activeTab === "roles" && <RolesTab />}
        {activeTab === "permissionSetup" && <RolePermissionSetupTab />}
      </div>
    </AdminPage>
  );
}
