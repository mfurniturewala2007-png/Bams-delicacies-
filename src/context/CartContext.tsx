import React, { createContext, useContext, useState, useMemo } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, dozens: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
  /** Epoch ms timestamp updated every time addItem is called — used to trigger badge bounce in Navbar */
  lastAddedAt: number | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CRITICAL RULE: Keeping all cart items strictly in React State. No localStorage or sessionStorage.
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedAt, setLastAddedAt] = useState<number | null>(null);

  const addItem = (newItem: CartItem) => {
    setLastAddedAt(Date.now());
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product_id === newItem.product_id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === newItem.product_id
            ? { ...item, dozens: item.dozens + newItem.dozens }
            : item
        );
      }
      return [...prevItems, newItem];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  };

  const updateQty = (productId: string, dozens: number) => {
    if (dozens <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId ? { ...item, dozens } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price_per_dozen * item.dozens, 0);
  }, [items]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.dozens, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      totalAmount,
      totalCount,
      lastAddedAt,
    }),
    [items, totalAmount, totalCount, lastAddedAt]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
