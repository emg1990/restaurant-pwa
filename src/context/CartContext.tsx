import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { OrderItem, MenuItem } from '../models/types';

interface CartContextType {
  items: OrderItem[];
  addToCart: (item: MenuItem, quantity: number, variant?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number, variant?: string) => void;
  updatePrice: (itemId: string, price: number, variant?: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (item: MenuItem, quantity: number, variant?: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.id && i.variantName === variant);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id && i.variantName === variant
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { itemId: item.id, name: item.name, quantity, unitPrice: item.price, variantName: variant }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number, variant?: string) => {
    setItems((prev) => {
      const newQuantity = Math.max(0, quantity);
      return prev.map((i) =>
        i.itemId === itemId && i.variantName === variant
          ? { ...i, quantity: newQuantity }
          : i
      );
    });
  };

  const updatePrice = (itemId: string, price: number, variant?: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId && i.variantName === variant
          ? { ...i, unitPrice: price }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, updatePrice, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
