import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Product, FRYING_CHARGE_PER_DOZEN } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (dozens: number, fried: boolean) => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [dozens, setDozens] = useState(1);
  const [fried, setFried] = useState(false);
  const { profile } = useAuth();
  const wasOpenRef = useRef(isOpen);

  // Reset every time the modal opens
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setDozens(1);
      setFried(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useScrollLock(isOpen);

  // Trap focus within modal for accessibility
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const basePrice = product.price * dozens;
  const fryingCharge = fried ? FRYING_CHARGE_PER_DOZEN * dozens : 0;
  const subtotal = basePrice + fryingCharge;

  const handleConfirmAdd = () => {
    onConfirm(dozens, fried);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-text">
      <div
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm touch-none"
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full bg-surface border border-border rounded-2xl p-5 md:p-6 shadow-2xl text-center animate-fade-slide-up flex flex-col items-center gap-4"
        style={{ maxWidth: '400px' }}
      >
        {/* Header */}
        <div className="w-full text-center">
          <h3 className="font-serif font-black text-xl text-heading leading-tight">
            Customise Order
          </h3>
          <p className="font-sans text-xs text-muted mt-1 leading-normal">
            {product.name}
          </p>
        </div>

        {/* ── Cooking Style toggle ── */}
        <div className="w-full">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 text-left">
            Cooking Style
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Unfried option */}
            <button
              onClick={() => setFried(false)}
              className={`flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border transition-all duration-200 ${
                !fried
                  ? 'bg-primary/10 border-primary shadow-primary'
                  : 'bg-surface-2 border-border/60 hover:border-border'
              }`}
            >
              <span className="text-2xl">🥙</span>
              <span className={`font-sans font-black text-sm ${!fried ? 'text-primary' : 'text-text/80'}`}>
                Unfried
              </span>
              <span className={`font-sans text-[10px] font-semibold ${!fried ? 'text-primary/70' : 'text-muted'}`}>
                No extra charge
              </span>
              {!fried && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                  ✓
                </span>
              )}
            </button>

            {/* Fried option */}
            <button
              onClick={() => setFried(true)}
              className={`flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border transition-all duration-200 ${
                fried
                  ? 'bg-accent/10 border-accent shadow-accent'
                  : 'bg-surface-2 border-border/60 hover:border-accent/50'
              }`}
            >
              <span className="text-2xl">🍳</span>
              <span className={`font-sans font-black text-sm ${fried ? 'text-accent-dim' : 'text-text/80'}`}>
                Fried
              </span>
              <span className={`font-sans text-[10px] font-semibold ${fried ? 'text-accent-dim/80' : 'text-muted'}`}>
                +₹{FRYING_CHARGE_PER_DOZEN}/dozen
              </span>
              {fried && (
                <span className="w-4 h-4 rounded-full bg-accent text-on-accent text-[9px] font-black flex items-center justify-center">
                  ✓
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dozen info badge */}
        <span
          className="font-sans font-bold text-xs rounded-full px-3.5 py-1 text-center bg-accent text-on-accent"
        >
          1 dozen = 12 pieces
        </span>

        {/* Interactive Counter */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setDozens((prev) => Math.max(1, prev - 1))}
            className="w-12 h-12 rounded-xl bg-surface-2 border border-border text-heading hover:text-primary hover:border-primary flex items-center justify-center font-sans font-black text-xl select-none transition-all duration-200"
          >
            −
          </button>
          <div className="text-center min-w-[100px]">
            <span className="font-serif font-black text-2xl text-text block">
              {dozens} {dozens === 1 ? 'dozen' : 'dozens'}
            </span>
            <span className="text-[11px] font-sans text-muted font-semibold mt-0.5 block uppercase tracking-wider">
              ({dozens * 12} pieces)
            </span>
          </div>
          <button
            onClick={() => setDozens((prev) => prev + 1)}
            className="w-12 h-12 rounded-xl bg-surface-2 border border-border text-heading hover:text-primary hover:border-primary flex items-center justify-center font-sans font-black text-xl select-none transition-all duration-200"
          >
            +
          </button>
        </div>

        <div className="w-full bg-surface-2 border border-border/60 p-4 rounded-xl space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-sans text-xs text-muted">
              Base ({dozens} doz × ₹{product.price})
            </span>
            <span className="font-sans text-xs font-semibold text-text">₹{basePrice}</span>
          </div>
          {fried && (
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs text-accent-dim">
                Frying ({dozens} doz × ₹{FRYING_CHARGE_PER_DOZEN})
              </span>
              <span className="font-sans text-xs font-semibold text-accent-dim">+₹{fryingCharge}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
            <span className="font-sans text-xs font-bold text-muted uppercase tracking-wider">
              Subtotal
            </span>
            <span className="font-serif text-2xl font-black text-accent">
              ₹{subtotal}
            </span>
          </div>
        </div>

        {/* Guest nudge */}
        {!profile && (
          <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/8 border border-primary/20">
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs font-sans text-primary/80 text-left leading-snug">
              You'll need to <strong>sign in</strong> to place your order after adding to cart.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-2 hover:bg-border/30 border border-border rounded-full font-sans font-bold text-sm text-text transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAdd}
            className="flex-1 py-3 bg-primary hover:bg-primary-hover rounded-full font-sans font-bold text-sm text-white shadow-primary transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Add to Cart ✓
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuantityModal;
