import React, { createContext, useContext, useState, useMemo } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
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

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setLastAddedAt(Date.now());
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product_id === newItem.product_id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === newItem.product_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { ...newItem, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  };

  const updateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
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
