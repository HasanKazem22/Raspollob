import type { Metadata } from "next";
import { Lora, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Admin panel UI font (the storefront keeps Lora as its brand face)
const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raspollob",
  description: "Your trusted source for pure honey, organic oils, and premium ghee.",
};

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingCart } from "@/components/shop/FloatingCart";
import { FloatingContact } from "@/components/FloatingContact";
import { OfferPopup } from "@/components/shop/OfferPopup";
import { BRAND_BOOT_SCRIPT } from "@/lib/brand";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { StoreConfigProvider } from "@/context/StoreConfigContext";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: browser extensions (ColorZilla, Grammarly, dark-mode tools…) add
    // attributes to <html>/<body> before React loads. This ignores attribute differences on these
    // two tags only; mismatches anywhere inside the app are still reported.
    <html
      lang="en"
      className={`${lora.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the last known brand colour before the first paint (no flash of the default) */}
        <script dangerouslySetInnerHTML={{ __html: BRAND_BOOT_SCRIPT }} />
      </head>
      <body className="h-screen flex flex-col overflow-hidden bg-background text-zinc-900" suppressHydrationWarning>
        <AuthProvider>
          <StoreConfigProvider>
          <TooltipProvider>
          <CartProvider>
            <Toaster 
              position="top-center" 
              toastOptions={{ 
                duration: 3000,
                style: {
                  background: '#ffffff',
                  color: '#18181b',
                  boxShadow: '0 4px 24px -6px rgba(0, 0, 0, 0.08), 0 2px 8px -4px rgba(0, 0, 0, 0.04)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  border: '1px solid #f4f4f5',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--brand)',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }} 
            />
            <Navbar />
            <FloatingCart />
            <FloatingContact />
            <OfferPopup />
            <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </main>
          </CartProvider>
          </TooltipProvider>
          </StoreConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
