"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  taxPercentage?: number;
  taxType: string;
};

export type CartItem = Product & {
  quantity: number;
};

type TotalBreakdown = {
  subtotal: number;
  totalGST: number;
  serviceTax: number;
  grandTotal: number;
};

interface CartContextType {
  cart: CartItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCart: any;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartBreakdown: (
    includeServiceTax: boolean,
    serviceTaxRate: number
  ) => TotalBreakdown;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartBreakdown = (
    includeServiceTax: boolean,
    serviceTaxRate: number
  ): TotalBreakdown => {
    let subtotal = 0;
    let totalGST = 0;

    for (const item of cart) {
      const quantity = item.quantity || 0;
      const price = item.price || 0;
      const gstRate = item.taxPercentage ?? 0;
      const taxType = item.taxType;

      let itemSubtotal = 0;
      let itemGST = 0;

      if (taxType === "inclusive") {
        // If tax type is inclusive, do not calculate GST separately
        itemSubtotal = price * quantity;
        itemGST = 0; // No GST to calculate for inclusive tax type
      } else {
        // If tax type is exclusive, calculate GST
        itemSubtotal = price * quantity;
        itemGST = ((price * gstRate) / 100) * quantity;
      }

      subtotal += itemSubtotal;
      totalGST += itemGST;
    }

    const serviceTax = includeServiceTax
      ? (subtotal + totalGST) * (serviceTaxRate / 100)
      : 0;

    return {
      subtotal,
      totalGST,
      serviceTax,
      grandTotal: subtotal + totalGST + serviceTax,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartBreakdown,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
