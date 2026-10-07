"use client";

import { useState } from "react";
import { LuEye, LuEyeOff, LuLoader, LuCheck, LuCircleAlert } from "react-icons/lu";
import { AuthCard } from "@/components/auth/AuthCard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BD_PHONE_ERROR, isValidBdPhone, normalizePhoneInput } from "@/lib/phone";

export default function SignupPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    const generatedUsername = fullName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    setFormData({ ...formData, fullName, username: generatedUsername });
  };

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const passwordsMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;
    if (!isValidBdPhone(formData.mobile)) {
      setErrorMsg(BD_PHONE_ERROR);
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          mobile: formData.mobile,
          password: formData.password,
        }),
      });
      
      const payload = res.success ? res.data : res;
      if (payload.accessToken || payload.token) {
        login(payload);
      } else if (res.success === false) {
        throw new Error(res.message || "Failed to create account.");
      }
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950/20 dark:focus:ring-white/20 transition-all duration-200";

  const labelClass =
    "block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 pl-0.5";

  if (isSuccess) {
    return (
      <AuthCard
        title="Account Created!"
        subtitle="You're all set — welcome to Raspollob."
        footerText="Already have an account?"
        footerActionText="Log in"
        footerActionLink="/login"
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-950/10 dark:bg-white/10 border border-zinc-950/20 dark:border-white/20 flex items-center justify-center shadow-lg">
            <LuCheck className="w-6 h-6 text-zinc-900 dark:text-white" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
            Your account has been created. You can now log in to your dashboard.
          </p>
          <a
            href="/login"
            className="w-full flex items-center justify-center bg-brand hover:bg-brand-hover dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold py-2.5 rounded-xl transition-all duration-200 shadow-lg text-sm tracking-wide"
          >
            Continue to Login
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Raspollob and start building today"
      footerText="Already have an account?"
      footerActionText="Log in"
      footerActionLink="/login"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">

        {/* Row 1: Full Name */}
        <div>
          <label htmlFor="fullName" className={labelClass}>Full Name</label>
          <input
            id="fullName"
            type="text"
            required
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleFullNameChange}
            className={inputClass}
          />
        </div>

        {/* Row 2: Username + Mobile — side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="username" className={labelClass}>Username</label>
            <input
              id="username"
              type="text"
              required
              placeholder="john_doe"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mobile" className={labelClass}>Mobile</label>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              placeholder="01XXXXXXXXX"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: normalizePhoneInput(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 3: Password + Confirm — side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${inputClass} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <LuEyeOff className="w-3.5 h-3.5" /> : <LuEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`${inputClass} pr-9 ${
                  passwordsMismatch
                    ? "border-red-400 dark:border-red-500"
                    : passwordsMatch
                    ? "border-emerald-400 dark:border-emerald-500"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <LuEyeOff className="w-3.5 h-3.5" /> : <LuEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mismatch hint */}
        {passwordsMismatch && (
          <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 -mt-0.5">
            <LuCircleAlert className="w-3 h-3 shrink-0" />
            <span className="text-[10px] font-medium">Passwords do not match</span>
          </div>
        )}

        {/* Backend Error */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg mt-1 border border-red-100 dark:border-red-900/30">
            <LuCircleAlert className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800/60 my-0.5" />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || passwordsMismatch}
          className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-60 text-white dark:text-black font-bold py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-zinc-950/10 dark:shadow-white/10 active:scale-[0.99] text-sm tracking-wide cursor-pointer"
        >
          {isSubmitting ? (
            <><LuLoader className="w-4 h-4 animate-spin" /><span>Creating account…</span></>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
