"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useStoreConfig } from "@/context/StoreConfigContext";
import type { StoreConfig } from "@/services/configService";
import { usePathname } from "next/navigation";
import { LuInstagram, LuFacebook, LuYoutube, LuPhone, LuMapPin, LuClock, LuMail } from "react-icons/lu";
import { SiTiktok } from "react-icons/si";
import { openHelpChat } from "@/components/FloatingContact";
import { useAuth } from "@/context/AuthContext";
import { PERM } from "@/lib/permissions";
import { showsSiteChrome } from "@/lib/siteChrome";

const FOOTER_LINKS = {
  "Customer Service": [
    { label: "Contact Us", action: "chat" as const },
    { label: "Shipping & Delivery", href: "/help?tab=shipping" },
    { label: "Returns & Refunds", href: "/help?tab=returns" },
    { label: "FAQs", href: "/help?tab=faqs" },
    { label: "Track Order", href: "/help?tab=track" },
  ],
};

export function Footer() {
  const pathname = usePathname();
  const { can } = useAuth();
  const canMessage = can(PERM.storefront.sendMessage);

  const { config } = useStoreConfig();

  if (!showsSiteChrome(pathname)) {
    return null;
  }

  return (
    <footer className="bg-[#FDFBF9] border-t border-zinc-200">
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl pt-12 pb-6 lg:pt-16 lg:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 xl:gap-12">

          {/* Brand */}
          <div className="flex flex-col gap-5 lg:col-span-2 lg:pr-10">
            <BrandLogo className="self-start" />
            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
              Your trusted source for pure honey, organic oils, and premium quality ghee. 100% natural, sourced from the finest farms directly to your table.
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              {[
                { platform: "facebook", icon: <LuFacebook className="w-4 h-4" />, href: config?.facebookUrl || "#" },
                { platform: "instagram", icon: <LuInstagram className="w-4 h-4" />, href: config?.instagramUrl || "#" },
                { platform: "youtube", icon: <LuYoutube className="w-4 h-4" />, href: config?.youtubeUrl || "#" },
                { platform: "tiktok", icon: <SiTiktok className="w-3.5 h-3.5" />, href: config?.tiktokUrl || "#" },
              ]
                .filter(s => {
                  if (!config) return true;
                  const activeKey = `${s.platform}Active` as keyof StoreConfig;
                  return config[activeKey] !== false;
                })
                .map(({ platform, icon, href }) => (
                  <a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-[#5c8b29] hover:border-[#5c8b29] hover:text-white transition-all shadow-2xs hover:shadow-md"
                  >
                    {icon}
                  </a>
                ))}
            </div>
          </div>

          {/* Customer Service Links */}
          <div>
            <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-900 mb-5">Customer Service</h4>
            <ul className="flex flex-col gap-3">
              {FOOTER_LINKS["Customer Service"]
                .filter((item) => item.action !== "chat" || canMessage)
                .map((item) =>
                item.action === "chat" ? (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={openHelpChat}
                      className="text-sm font-medium text-zinc-500 hover:text-[#5c8b29] transition-colors cursor-pointer text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link
                      href={item.href || "#"}
                      className="text-sm font-medium text-zinc-500 hover:text-[#5c8b29] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Need Help */}
          <div>
            <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-900 mb-5">Need Help?</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-zinc-500">
                <LuMapPin className="w-4 h-4 mt-1 shrink-0 text-[#5c8b29]" />
                <span className="text-sm leading-relaxed">{config?.storeAddress || "123 Organic Farm Road, Green Valley, NY 10001"}</span>
              </div>
              <div className="flex items-start gap-3 text-zinc-500">
                <LuClock className="w-4 h-4 mt-0.5 shrink-0 text-[#5c8b29]" />
                <span className="text-sm">{config?.storeHours || "Mon – Fri: 9:00 AM – 6:00 PM"}</span>
              </div>
              <div className="flex items-start gap-3 text-zinc-500">
                <LuMail className="w-4 h-4 mt-0.5 shrink-0 text-[#5c8b29]" />
                <a href={`mailto:${config?.storeEmail || "hello@raspollob.com"}`} className="text-sm hover:text-[#5c8b29] transition-colors">{config?.storeEmail || "hello@raspollob.com"}</a>
              </div>
              <div className="flex items-start gap-3 text-zinc-500">
                <LuPhone className="w-4 h-4 mt-0.5 shrink-0 text-[#5c8b29]" />
                <a href={`tel:${config?.storePhone || "+18001234567"}`} className="text-sm hover:text-[#5c8b29] transition-colors">{config?.storePhone || "+1 (800) 123-4567"}</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-200 mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-400">
            © {new Date().getFullYear()} Raspollob. All rights reserved.
          </p>
          <p className="text-[11px] text-zinc-400">
            Developed By Hasib
          </p>
        </div>
      </div>
    </footer>
  );
}

