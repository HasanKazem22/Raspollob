"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuShoppingBag, LuX, LuArrowRight, LuPlus } from "react-icons/lu";
import { QuantityAdjuster } from "@/components/shop/QuantityAdjuster";
import { CartItem, useCart } from "@/context/CartContext";
import { getCurrentPrice, getLinePrice, getPrimaryImage, getProductName } from "@/lib/product";
import { resolveMediaUrl } from "@/lib/api";
import { productService } from "@/services/productService";
import { useRemoteData } from "@/hooks/useRemoteData";
import { showsFloatingCart } from "@/lib/siteChrome";

const fetchRecommendations = () => productService.getTrendingProducts(8).then((res) => res.data ?? []);

export function CartThumb({ item, className }: { item: Pick<CartItem, "imageUrl" | "name">; className: string }) {
  return (
    <div className={`${className} bg-zinc-50 rounded-lg shrink-0 border border-zinc-100 overflow-hidden`}>
      {item.imageUrl && (
        <img src={resolveMediaUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
      )}
    </div>
  );
}

/** Trending products not already in the cart. Mounted only while the drawer is open. */
function CartRecommendations() {
  const { cartItems, addToCart } = useCart();
  const { status, data = [] } = useRemoteData(fetchRecommendations);
  const inCart = new Set(cartItems.map((item) => item.id));
  const suggestions = data.filter((p) => !inCart.has(String(p.id))).slice(0, 3);

  if (status !== "success" || suggestions.length === 0) return null;

  return (
    <div className="mt-8 bg-zinc-50 -mx-4 px-4 py-6 border-t border-zinc-100">
      <h3 className="font-bold text-zinc-900 mb-4 border-b-2 border-[#5c8b29] inline-block pb-1">You May Also Like</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {suggestions.map((product) => (
          <div key={product.id} className="w-[200px] shrink-0 bg-white border border-zinc-100 rounded-xl p-3 flex gap-3">
            <CartThumb item={{ imageUrl: getPrimaryImage(product), name: getProductName(product) }} className="w-16 h-16" />
            <div className="flex flex-col justify-between">
              <span className="text-[11px] font-medium leading-tight line-clamp-2">{getProductName(product)}</span>
              <span className="text-[10px] text-zinc-500">৳{Number(getCurrentPrice(product)).toFixed(2)}</span>
              <button
                onClick={() => addToCart(product)}
                className="text-[10px] bg-[#5c8b29] text-white px-2 py-0.5 rounded flex items-center justify-center gap-1 self-start mt-1"
              >
                <LuPlus className="w-2 h-2" /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FloatingCart() {
  const { cartItems, cartCount, subtotal, updateQuantity, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (!showsFloatingCart(pathname)) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#5c8b29] text-white rounded-l-xl shadow-xl flex flex-col items-center overflow-hidden border border-[#5c8b29] hover:pr-2 transition-all"
      >
        <div className="flex flex-col items-center gap-1 p-3 bg-[#5c8b29] w-full">
          <LuShoppingBag className="w-5 h-5" />
          <span className="text-xs font-bold whitespace-nowrap">{cartCount} Items</span>
        </div>
        <div className="bg-white text-[#5c8b29] w-full py-2 px-3 text-sm font-bold border-t border-[#5c8b29]">
          ৳{subtotal.toFixed(2)}
        </div>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Cart */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2">
            SHOPPING CART
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            Close <LuArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 border border-zinc-100 p-3 rounded-xl relative bg-white">
              <Tooltip content="Remove from cart" side="left">
              <button 
                onClick={() => removeFromCart(item.id)}
                aria-label={`Remove ${item.name}`}
                className="absolute top-3 right-3 text-zinc-400 hover:text-red-500"
              >
                <LuX className="w-4 h-4" />
              </button>
              </Tooltip>
              
              <CartThumb item={item} className="w-16 h-16" />
              
              <div className="flex flex-col flex-grow justify-between pr-4">
                <span className="text-sm font-medium text-zinc-900 line-clamp-1">{item.name}</span>
                <div className="flex items-center gap-2 mt-2">
                  <QuantityAdjuster
                    quantity={item.quantity}
                    onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                    onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex items-center border border-zinc-200 rounded-full h-8 bg-white"
                    buttonClassName="px-2 h-full flex items-center justify-center text-zinc-500 hover:text-[#5c8b29]"
                    textClassName="text-xs font-bold w-4 text-center"
                    iconClassName="w-3 h-3"
                  />
                  <span className="text-xs text-zinc-500">× ৳{getLinePrice(item).toFixed(2)}</span>
                  <span className="text-xs font-bold text-zinc-900 ml-auto">= ৳{(getLinePrice(item) * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}

          {cartItems.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-10">Your cart is empty.</p>
          )}

          {isOpen && <CartRecommendations />}
        </div>

        {/* Footer Checkout */}
        <div className="p-4 border-t border-zinc-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-zinc-900">Total:</span>
            <span className="font-bold text-lg text-zinc-900">৳{subtotal.toFixed(2)}</span>
          </div>
          <Link 
            href="/checkout"
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#5c8b29] hover:bg-[#4a7021] text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center text-sm"
          >
            CHECKOUT
          </Link>
        </div>
      </div>
    </>
  );
}

