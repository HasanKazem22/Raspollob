"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getCategoryName, getCurrentPrice, getLinePrice, getPrimaryImage, getProductName } from "@/lib/product";

/** Snapshot of a product at the time it was added to the cart. */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  quantity: number;
}

// Bumped when the stored shape changes, so stale carts are dropped
const STORAGE_KEY = "shopping_cart_v2";

interface CartContextType {
  cartItems: CartItem[];
  /** Accepts any product shape returned by the API */
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (product: any, quantity: number = 1) => {
    const id = String(product.id);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + quantity } : item));
      }
      const snapshot: CartItem = {
        id,
        name: getProductName(product),
        price: Number(getCurrentPrice(product)),
        imageUrl: getPrimaryImage(product) || undefined,
        categoryName: getCategoryName(product) || undefined,
        quantity,
      };
      return [...prev, snapshot];
    });
    toast.success(`Added ${getProductName(product)} to cart`);
  };

  const removeFromCart = (id: string | number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== String(id)));
    toast.success("Removed from cart");
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) => prev.map((item) => (item.id === String(id) ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + getLinePrice(item) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
