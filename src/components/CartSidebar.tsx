import React from 'react';
import { useCart } from '../context/CartContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQty, totalAmount } = useCart();

  if (!isOpen) return null;

  const handleProceedToOrder = () => {
    onClose();
    // Smooth scroll to the order section
    const orderSection = document.getElementById('order');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay behind (70% opacity) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0D0D0D]/70 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        {/* Slide in panel from right */}
        <div className="w-screen max-w-md pointer-events-auto">
          <div className="h-full flex flex-col bg-surface border-l border-border shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="px-6 py-6 border-b border-border flex items-center justify-between">
              <h2 className="font-serif font-black text-2xl text-heading flex items-center gap-2">
                <span>Your Order</span>
                <span className="text-xl">🛒</span>
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary focus:outline-none transition-all duration-200"
                aria-label="Close Shopping Cart"
              >
                {/* SVG Close Cross */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* In-Memory Cart List */}
            <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                  <span className="text-5xl mb-4 animate-float" style={{ animationDuration: '3s' }}>
                    🍛
                  </span>
                  <h3 className="font-serif font-bold text-lg text-heading">
                    Nothing here yet
                  </h3>
                  <p className="text-muted text-sm mt-2 max-w-xs">
                    Browse the menu and add delicious homemade specials!
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-4 p-4 rounded-2xl bg-surface-2 border border-border/60 hover:border-border transition-colors duration-250 items-center justify-between"
                  >
                    {/* Item Thumbnail & Details */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-bg border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLSpanElement;
                              if (fallback) fallback.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span
                          className="text-xl"
                          style={{ display: item.image_url ? 'none' : 'inline' }}
                        >
                          🍳
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-sans font-bold text-sm text-text truncate">
                          {item.name}
                        </h4>
                        <p className="font-serif text-xs text-yellow font-semibold mt-1">
                          ₹{item.price} <span className="font-sans text-muted/80 font-normal">each</span>
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls & Total */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5 bg-bg border border-border rounded-lg p-1">
                        <button
                          onClick={() => updateQty(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-md hover:bg-surface border border-transparent hover:border-border text-text hover:text-primary transition-all duration-200 flex items-center justify-center font-bold text-sm select-none"
                        >
                          −
                        </button>
                        <span className="font-sans font-bold text-xs px-2 w-5 text-center text-text select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md hover:bg-surface border border-transparent hover:border-border text-text hover:text-primary transition-all duration-200 flex items-center justify-center font-bold text-sm select-none"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-serif text-sm font-semibold text-text font-bold">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Sticky panel */}
            {items.length > 0 && (
              <div className="border-t border-border bg-surface-2 p-6 space-y-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-sans font-semibold text-muted text-sm uppercase tracking-wider">
                    Subtotal
                  </span>
                  <span className="font-serif text-3xl font-black text-yellow">
                    ₹{totalAmount}
                  </span>
                </div>

                <button
                  onClick={handleProceedToOrder}
                  className="w-full bg-primary text-white font-sans font-bold text-base py-4 rounded-full shadow-primary hover:bg-primary-hover hover:scale-[1.02] hover:shadow-primary-strong active:scale-98 transition-all duration-300"
                >
                  Proceed to Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
