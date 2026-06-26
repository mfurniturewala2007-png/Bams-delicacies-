import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Product } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (dozens: number) => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [dozens, setDozens] = useState(1);

  // Reset quantity to 1 every time the modal opens for a (possibly different) product
  useEffect(() => {
    if (isOpen) setDozens(1);
  }, [isOpen]);

  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleConfirmAdd = () => {
    onConfirm(dozens);
  };

  // Render into document.body via portal so CSS transforms on parent
  // containers (e.g. the marquee carousel) don't create a new stacking
  // context that traps the fixed-position modal.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-text">
      <div
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm touch-none"
      />

      <div
        className="relative z-10 w-full bg-surface border border-border rounded-2xl p-5 md:p-6 shadow-2xl text-center animate-fade-slide-up flex flex-col items-center gap-5"
        style={{ maxWidth: '380px' }}
      >
        {/* Header */}
        <div className="w-full text-center">
          <h3 className="font-serif font-black text-xl text-heading leading-tight">
            Select Quantity
          </h3>
          <p className="font-sans text-xs text-muted mt-1 leading-normal">
            {product.name}
          </p>
        </div>

        {/* Starter Yellow badge */}
        <span
          className="font-sans font-bold text-xs rounded-full px-3.5 py-1 text-center"
          style={{ backgroundColor: '#F5C200', color: '#1E1E1E' }}
        >
          1 dozen = 12 pieces
        </span>

        {/* Interactive Counter */}
        <div className="flex items-center gap-5 my-2">
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

        {/* Subtotal line */}
        <div className="w-full flex justify-between items-center bg-surface-2 border border-border/60 p-4 rounded-xl">
          <span className="font-sans text-xs font-bold text-muted uppercase tracking-wider">
            Subtotal
          </span>
          <span className="font-serif text-2xl font-black text-yellow">
            ₹{product.price * dozens}
          </span>
        </div>

        {/* Actions button row */}
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
