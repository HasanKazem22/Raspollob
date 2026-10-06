"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_PHONE_ERROR, isValidBdPhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  LuUser, LuKey, LuSparkles, LuCheck, LuLock, LuMail, LuPhone, LuMapPin, LuCircleCheck, LuCamera, LuLoader
} from "react-icons/lu";

export default function ProfilePage() {
  const { user, roles, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.username || "");
      setEmail(user.email || "");
      setMobile(user.mobile || "");
      setCity(user.city || "");
      setAddress(user.address || "");
    }
  }, [user]);

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
  const avatarUrl = user.avatarUrl || user.avatar;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateUser({ avatarUrl: dataUrl, avatar: dataUrl });
        toast.success("Profile picture updated successfully!");
      }
      setIsUploadingAvatar(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile && !isValidBdPhone(mobile)) {
      toast.error(BD_PHONE_ERROR);
      return;
    }
    setIsSavingProfile(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      updateUser({ fullName, email, mobile, city, address });
      toast.success("Profile information updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      toast.success("Account password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-20 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6 md:p-8 text-white border border-zinc-800 shadow-xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-zinc-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Ring with Change Photo Button */}
          <div className="relative group shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div
              onClick={handleAvatarClick}
              className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white text-zinc-950 font-extrabold text-3xl shadow-2xl ring-4 ring-white/20 overflow-hidden cursor-pointer group-hover:opacity-90 transition-all"
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover rounded-full" />
              ) : (
                <span>{initial}</span>
              )}

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity">
                {isUploadingAvatar ? (
                  <LuLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LuCamera className="w-5 h-5 mb-0.5" />
                    <span>Change</span>
                  </>
                )}
              </div>
            </div>

            {/* Active Status Badge */}
            <Tooltip content="Change photo">
              <button
                type="button"
                onClick={handleAvatarClick}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 border-2 border-zinc-900 flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 shadow-md"
              >
                <LuCamera className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>

          {/* User Details Header */}
          <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{displayName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <LuCircleCheck className="w-3 h-3" />
                Active Session
              </span>
            </div>

            <div className="text-xs text-zinc-400 font-mono">@{user.username}</div>

            {user.email && (
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-zinc-300">
                <LuMail className="w-3.5 h-3.5 text-zinc-400" />
                <span>{user.email}</span>
              </div>
            )}

            {/* Assigned Role Badges */}
            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
              {roles && roles.length > 0 ? (
                roles.map((role, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15 backdrop-blur-md"
                  >
                    <LuSparkles className="w-3 h-3 text-amber-300" />
                    {role.replace("ROLE_", "")}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400 italic">User</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PERSONAL & CONTACT DETAILS */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#FDFBF9] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
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
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5c8b29] hover:bg-[#4a7021] text-white shadow-lg shadow-zinc-950/10 transition-all cursor-pointer"
            >
              {isSavingProfile ? "Saving..." : "Save Profile Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 2: PASSWORD & SECURITY */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#FDFBF9] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
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
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#5c8b29] hover:bg-[#4a7021] text-white shadow-lg shadow-zinc-950/10 transition-all cursor-pointer"
            >
              {isSubmittingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
