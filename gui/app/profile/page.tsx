"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_PHONE_ERROR, isValidBdPhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { ImageInput } from "@/components/ui/image-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { accountService } from "@/services/accountService";
import { MyOrders } from "@/components/orders/MyOrders";
import { SegmentedTabs } from "@/components/ui/tabs";
import {
  LuUser, LuKey, LuShoppingBag, LuLock, LuMail, LuPhone, LuMapPin
} from "react-icons/lu";

export default function ProfilePage() {
  const { user, roles, applyAccount } = useAuth();
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "orders">("profile");
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Refill the form only when the saved profile details change (not on a photo change),
  // so unsaved edits survive uploading a photo
  const savedProfile = user
    ? JSON.stringify([user.fullName || user.username, user.email, user.mobile, user.city, user.address])
    : "";
  const [filledFrom, setFilledFrom] = useState("");
  if (user && savedProfile !== filledFrom) {
    setFilledFrom(savedProfile);
    setFullName(user.fullName || user.username || "");
    setEmail(user.email || "");
    setMobile(user.mobile || "");
    setCity(user.city || "");
    setAddress(user.address || "");
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <LuLock className="w-8 h-8 text-zinc-400 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Authentication Required</h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Please log in to your account to view and manage your profile settings.
          </p>
        </div>
      </div>
    );
  }

  const displayName = fullName || user.username;
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user.avatarUrl || "";

  /** Uploads to the server (resized there) and returns the stored URL for the preview. */
  const handleAvatarUpload = async (file: File) => {
    const account = await accountService.uploadAvatar(file);
    applyAccount(account);
    toast.success("Profile photo updated");
    return account.avatarUrl ?? "";
  };

  const handleRemovePhoto = async () => {
    setIsRemovingPhoto(true);
    try {
      applyAccount(await accountService.removeAvatar());
      toast.success("Profile photo removed");
      setConfirmRemovePhoto(false);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't remove the photo. Please try again.");
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!isValidBdPhone(mobile)) {
      toast.error(BD_PHONE_ERROR);
      return;
    }
    setIsSavingProfile(true);
    try {
      const account = await accountService.updateMe({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim(),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
      });
      applyAccount(account);
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't save your profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("The new password must be at least 6 characters.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await accountService.changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't change your password. Please try again.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-20 space-y-5 animate-in fade-in duration-200">
      <ConfirmDialog
        isOpen={confirmRemovePhoto}
        onOpenChange={(open) => !open && setConfirmRemovePhoto(false)}
        title="Remove profile photo"
        message="Your photo will be deleted and your initial shown instead. You can upload a new one any time."
        confirmText="Remove photo"
        onConfirm={handleRemovePhoto}
        isLoading={isRemovingPhoto}
      />
      {/* Compact account header */}
      <div className="flex items-center gap-4 sm:gap-5 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Photo: upload, change or remove (stored on the server) */}
        <ImageInput
          variant="avatar"
          size="sm"
          value={avatarUrl}
          onUpload={handleAvatarUpload}
          onRemove={() => setConfirmRemovePhoto(true)}
          maxSizeMb={5}
          className="shrink-0"
          fallback={<span className="text-2xl font-extrabold text-zinc-700">{initial}</span>}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white truncate">{displayName}</h1>
          <p className="text-xs text-zinc-500 truncate">
            <span className="font-mono">@{user.username}</span>
            {user.email && <span> · {user.email}</span>}
          </p>
          {roles && roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-brand/10 text-brand-strong"
                >
                  {role.replace("ROLE_", "")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* One section at a time: no long scrolling page */}
      <SegmentedTabs
        fullWidth
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "profile", label: "Profile", icon: LuUser },
          { id: "security", label: "Password", icon: LuKey },
          { id: "orders", label: "My Orders", icon: LuShoppingBag },
        ]}
      />

      {/* Order history */}
      {activeTab === "orders" && <MyOrders />}

      {/* SECTION 1: PERSONAL & CONTACT DETAILS */}
      {activeTab === "profile" && (
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <LuUser className="w-4.5 h-4.5 text-zinc-500" />
            Personal Profile Details
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Update your account details and primary contact information.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Full Name</label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Hasibul Hasan"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Username</label>
              <Input
                type="text"
                disabled
                value={user.username}
                className="bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed opacity-75 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Email Address</label>
              <div className="relative">
                <LuMail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Mobile Number</label>
              <div className="relative">
                <LuPhone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <PhoneInput value={mobile} onChange={setMobile} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">City / Region</label>
              <div className="relative">
                <LuMapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-9"
                  placeholder="Dhaka"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Shipping / Home Address</label>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Street, Area..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-lg shadow-zinc-950/10 transition-all cursor-pointer"
            >
              {isSavingProfile ? "Saving..." : "Save Profile Changes"}
            </Button>
          </div>
        </form>
      </div>
      )}

      {/* SECTION 2: PASSWORD & SECURITY */}
      {activeTab === "security" && (
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <LuKey className="w-4.5 h-4.5 text-zinc-500" />
            Security & Password Update
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Keep your account secure by updating your password regularly.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Current Password</label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">New Password</label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">Confirm New Password</label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmittingPassword}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-lg shadow-zinc-950/10 transition-all cursor-pointer"
            >
              {isSubmittingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
}
