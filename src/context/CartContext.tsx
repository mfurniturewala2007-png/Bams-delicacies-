import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CartItem, FRYING_CHARGE_PER_DOZEN } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, fried: boolean) => void;
  updateQty: (productId: string, fried: boolean, dozens: number) => void;
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

  const addItem = useCallback((newItem: CartItem) => {
    setLastAddedAt(Date.now());
    setItems((prevItems) => {
      const existing = prevItems.find(
        (item) => item.product_id === newItem.product_id && item.fried === newItem.fried
      );
      if (existing) {
        return prevItems.map((item) =>
          item.product_id === newItem.product_id && item.fried === newItem.fried
            ? { ...item, dozens: item.dozens + newItem.dozens }
            : item
        );
      }
      return [...prevItems, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string, fried: boolean) => {
    setItems((prevItems) =>
      prevItems.filter((item) => !(item.product_id === productId && item.fried === fried))
    );
  }, []);

  const updateQty = useCallback((productId: string, fried: boolean, dozens: number) => {
    if (dozens <= 0) {
      removeItem(productId, fried);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId && item.fried === fried ? { ...item, dozens } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + (item.price_per_dozen + (item.fried ? FRYING_CHARGE_PER_DOZEN : 0)) * item.dozens,
      0
    );
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
    [items, totalAmount, totalCount, lastAddedAt, addItem, removeItem, updateQty, clearCart]
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
