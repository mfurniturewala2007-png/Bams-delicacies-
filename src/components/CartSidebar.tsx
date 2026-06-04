import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQty, totalAmount, removeItem } = useCart();
  const { profile, openAuthModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleProceedToOrder = () => {
    onClose();
    if (!profile) {
      openAuthModal();
      return;
    }
    if (location.pathname === '/pheli-raat') {
      const orderSection = document.getElementById('checkout-festive');
      if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const orderSection = document.getElementById('order');
      if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/#order');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay behind (70% opacity) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0D0D0D]/70 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pointer-events-none">
        {/* Slide in panel from right — full screen on mobile, max-md on desktop */}
        <div className="w-screen sm:max-w-md pointer-events-auto">
          <div className="h-full flex flex-col bg-surface border-l border-border shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-serif font-black text-2xl text-heading flex items-center gap-2">
                <span>Your Order</span>
                <span className="text-xl">🛒</span>
              </h2>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary focus:outline-none transition-all duration-200"
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
            <div className="flex-grow overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-4">
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
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-surface-2 border border-border/60 hover:border-border transition-colors duration-250 items-center justify-between"
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
                      <div className="min-w-0 text-left">
                        <h4 className="font-sans font-bold text-sm text-text truncate">
                          {item.name}
                        </h4>
                        <p className="font-serif text-xs text-yellow font-semibold mt-1">
                          ₹{item.price_per_dozen} <span className="font-sans text-muted/80 font-normal">/ doz</span>
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls & Total */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
                          <button
                            onClick={() => updateQty(item.product_id, item.dozens - 1)}
                            className="w-9 h-9 rounded-lg hover:bg-surface border border-transparent hover:border-border text-text hover:text-primary transition-all duration-200 flex items-center justify-center font-bold text-lg select-none active:scale-95"
                          >
                            −
                          </button>
                          <span className="font-sans font-bold text-sm px-2 min-w-[28px] text-center text-text select-none">
                            {item.dozens}
                          </span>
                          <button
                            onClick={() => updateQty(item.product_id, item.dozens + 1)}
                            className="w-9 h-9 rounded-lg hover:bg-surface border border-transparent hover:border-border text-text hover:text-primary transition-all duration-200 flex items-center justify-center font-bold text-lg select-none active:scale-95"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="font-sans text-[10px] text-muted font-medium mb-0.5 block uppercase tracking-wider">
                            ({item.dozens * 12} pcs)
                          </span>
                          <span className="font-serif text-sm font-bold text-text">
                            ₹{item.price_per_dozen * item.dozens}
                          </span>
                        </div>
                      </div>

                      {/* Explicit trash bin remove button — 44px touch target */}
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="w-11 h-11 flex items-center justify-center text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-all duration-200 focus:outline-none flex-shrink-0 active:scale-95"
                        title="Remove item"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="w-4 h-4 sm:w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Sticky panel — safe-area aware */}
            {items.length > 0 && (
              <div className="border-t border-border bg-surface-2 p-4 sm:p-6 space-y-4 flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
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
