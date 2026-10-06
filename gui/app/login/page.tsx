"use client";

import { useState } from "react";
import Link from "next/link";
import { LuEye, LuEyeOff, LuLoader, LuCircleAlert } from "react-icons/lu";
import { AuthCard } from "@/components/auth/AuthCard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Where to go after login, from `?next=` (set by middleware for protected pages).
 * Only same-site paths are allowed, so the parameter can't be used as an open redirect.
 */
function getSafeRedirect(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  // Reject protocol-relative forms like "//evil.com" and "/\evil.com"
  return next && /^\/(?![/\\])/.test(next) ? next : "/";
}

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify(formData),
      });
      
      const payload = res.success ? res.data : res;
      if (payload.accessToken || payload.token) {
        login(payload, getSafeRedirect());
      } else {
        throw new Error(res.message || "Invalid credentials");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950/20 dark:focus:ring-white/20 transition-all duration-200";

  const labelClass =
    "block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5";

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log In to your Raspollob account to continue"
      footerText="Don't have an account?"
      footerActionText="Sign Up"
      footerActionLink="/signup"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Identifier */}
        <div>
          <label htmlFor="identifier" className={labelClass}>
            Username or Email
          </label>
          <input
            id="identifier"
            type="text"
            required
            placeholder="john_doe or john@example.com"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className={`${labelClass} mb-0`}>
              Password
            </label>
            <Link
              href="#"
              className="text-[10px] font-semibold text-zinc-400 hover:text-[#5c8b29] dark:hover:text-white uppercase tracking-widest transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Backend Error */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg mt-1 border border-red-100 dark:border-red-900/30">
            <LuCircleAlert className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800/60 my-2" />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#5c8b29] hover:bg-[#4a7021] dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-60 text-white dark:text-black font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-zinc-950/10 dark:shadow-white/10 active:scale-[0.99] text-sm tracking-wide cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <LuLoader className="w-4 h-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Log In</span>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
