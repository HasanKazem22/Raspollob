"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Tooltip } from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { categoryService, Category } from "@/services/categoryService";
import {
  LuSearch,
  LuUser,
  LuShoppingCart,
  LuMenu,
  LuX,
  LuPower,
  LuLayers,
} from "react-icons/lu";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navbarCategories, setNavbarCategories] = useState<Category[]>([]);

  const { isAuthenticated, canAccessAdmin, user, logout } = useAuth();
  const { cartCount } = useCart();

  useEffect(() => {
    let isMounted = true;
    categoryService
      .getNavbarCategories()
      .then((res) => {
        if (isMounted && res.data) {
          setNavbarCategories(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/print")) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] py-3 md:py-3.5 transition-all border-b border-zinc-200">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 max-w-7xl">
        {/* Left Side: Logo */}
        <div className="flex items-center">
          <BrandLogo />
        </div>

        {/* Middle Side: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7 lg:gap-9">
          <Link
            href="/"
            className={`text-[15px] tracking-wide transition-colors ${
              pathname === "/"
                ? "text-[#5c8b29] font-bold"
                : "text-zinc-600 font-medium hover:text-[#5c8b29]"
            }`}
          >
            Home
          </Link>

          {/* Dynamic Categories */}
          {navbarCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className={`text-[15px] tracking-wide transition-colors text-zinc-600 font-medium hover:text-[#5c8b29]`}
            >
              {cat.name}
            </Link>
          ))}

          {/* Admin Link — staff only */}
          {canAccessAdmin && (
            <Link
              href="/admin"
              className={`text-[15px] tracking-wide transition-colors ${
                pathname.startsWith("/admin")
                  ? "text-[#5c8b29] font-bold"
                  : "text-zinc-600 font-medium hover:text-[#5c8b29]"
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right Side: Action Icons */}
        <div className="flex items-center gap-5">
          <Tooltip content="Search">
            <button type="button" aria-label="Search" className="text-zinc-700 hover:text-[#5c8b29] transition-colors cursor-pointer">
              <LuSearch className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
            </button>
          </Tooltip>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Tooltip content="Profile">
                <Link
                  href="/profile"
                  aria-label="Profile"
                  className="flex items-center text-zinc-700 hover:text-[#5c8b29] transition-colors rounded-full border border-zinc-200 hover:border-[#5c8b29]"
                >
                  {user?.avatarUrl || user?.avatar ? (
                    <img
                      src={user.avatarUrl || user.avatar}
                      alt=""
                      className="w-[20px] h-[20px] md:w-6 md:h-6 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-[20px] h-[20px] md:w-6 md:h-6 bg-zinc-100 flex items-center justify-center rounded-full">
                      <LuUser className="w-[14px] h-[14px] md:w-4 md:h-4" strokeWidth={1.5} />
                    </div>
                  )}
                </Link>
              </Tooltip>
              <Tooltip content="Logout">
                <button
                  type="button"
                  onClick={() => logout()}
                  aria-label="Logout"
                  className="text-zinc-700 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LuPower className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
                </button>
              </Tooltip>
            </div>
          ) : (
            <Tooltip content="Login">
              <Link href="/login" aria-label="Login" className="text-zinc-700 hover:text-[#5c8b29] transition-colors">
                <LuUser className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
              </Link>
            </Tooltip>
          )}

          <Tooltip content="Cart">
            <Link
              href="/checkout"
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
              className="relative text-zinc-700 hover:text-[#5c8b29] transition-colors"
            >
              <LuShoppingCart className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#5c8b29] text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-[#FDFBF9]">
                  {cartCount}
                </span>
              )}
            </Link>
          </Tooltip>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center ml-2 text-zinc-700 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <LuX className="w-6 h-6" strokeWidth={1.5} />
            ) : (
              <LuMenu className="w-6 h-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Right Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-white z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <span className="font-bold text-zinc-900">Menu</span>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FDFBF9]">
          <div className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Home
            </Link>
            {canAccessAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Admin
              </Link>
            )}
          </div>

          {navbarCategories.length > 0 && (
            <div className="pt-2 border-t border-zinc-200/60">
              <span className="px-4 text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">
                Categories
              </span>
              <div className="flex flex-col space-y-1">
                {navbarCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                  >
                    <LuLayers className="w-3.5 h-3.5 text-[#5c8b29]" />
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

