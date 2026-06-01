import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import QuantityModal from './QuantityModal';

interface ProductCardProps {
  product: Product;
  index: number;
  isDark?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index, isDark = false }) => {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (!product.in_stock) return;
    setIsModalOpen(true);
  };

  const handleConfirmAdd = (dozens: number) => {
    addItem({
      product_id: product.id,
      name: product.name,
      price_per_dozen: product.price,
      dozens: dozens,
      image_url: product.image_url || '',
      category: product.category || '',
    });

    setIsModalOpen(false);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <>
      <div
        className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between group overflow-hidden opacity-0 animate-fade-slide-up ${
          isDark
            ? 'bg-[#150F0A]/90 border-[#DFBA73]/15 hover:border-[#DFBA73]/60 hover:shadow-[0_0_24px_rgba(223,186,115,0.15)]'
            : 'bg-surface border-border/40 hover:border-primary/50 hover:shadow-yellow hover:-translate-y-1.5'
        }`}
        style={{ animationDelay: `${index * 100}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Product Image Cover (Aspect 4:3 Ratio for modern layouts) */}
        <div className={`relative aspect-[4/3] w-full overflow-hidden border-b ${
          isDark ? 'bg-[#0E0A07] border-[#DFBA73]/10' : 'bg-surface-2 border-border/40'
        }`}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLDivElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Gray Fallback Image Area with centered plate emoji */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center text-muted ${
              isDark ? 'bg-[#150F0A] text-[#FFF8EE]/60' : 'bg-surface-2'
            }`}
            style={{ display: product.image_url ? 'none' : 'flex' }}
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
            <span className={`text-[10px] font-sans mt-2 ${isDark ? 'text-[#FFF8EE]/40' : 'text-muted/65'}`}>Homemade Delicacy</span>
          </div>

          {/* Dynamic Category Pill Badge */}
          {product.category && (
            <span className={`absolute top-3 right-3 backdrop-blur-md border text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm capitalize ${
              isDark
                ? 'bg-[#150F0A]/95 border-[#DFBA73]/30 text-[#DFBA73]'
                : 'bg-bg/85 border-border/40 text-primary'
            }`}>
              {product.category}
            </span>
          )}
        </div>

        {/* Card Details Body */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between">
          <div className="text-left">
            {/* Product Name */}
            <h3 className={`font-sans font-bold text-xs sm:text-sm md:text-base leading-snug transition-colors duration-200 tracking-tight line-clamp-1 ${
              isDark ? 'text-[#FFFAF4] group-hover:text-[#E3A857]' : 'text-heading group-hover:text-primary'
            }`}>
              {product.name}
            </h3>

            {/* Description line-clamped */}
            <p className={`font-sans font-medium text-[10px] sm:text-xs mt-1.5 line-clamp-2 min-h-[2rem] leading-relaxed ${
              isDark ? 'text-[#FFFAF4]/65' : 'text-muted'
            }`}>
              {product.description || 'Prepared fresh with finest ingredients. Delivered clean and hot.'}
            </p>
          </div>

          {/* Modern Snappy Bottom Row: Price on left, Floating Add circle on right */}
          <div className={`mt-3 flex items-center justify-between gap-2 text-left border-t pt-2.5 ${
            isDark ? 'border-[#DFBA73]/10' : 'border-border/20'
          }`}>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg md:text-xl font-black text-[#E3A857] leading-tight">
                ₹{product.price}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-sans mt-0.5 ${
                isDark ? 'text-[#FFF8EE]/50' : 'text-muted'
              }`}>
                per {product.unit_label || '12 pcs'}
              </span>
            </div>

            <button
              onClick={handleOpenModal}
              disabled={!product.in_stock}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-[1.08] active:scale-90 select-none flex-shrink-0 focus:outline-none ${
                !product.in_stock
                  ? isDark
                    ? 'bg-white/[0.03] border border-white/[0.08] text-[#FFF8EE]/20 cursor-not-allowed shadow-none'
                    : 'bg-surface-2 text-muted/40 border border-border/60 cursor-not-allowed shadow-none'
                  : isAdded
                  ? 'bg-success text-white'
                  : isDark
                  ? 'bg-[#E3A857] text-[#150F0A] hover:bg-[#DFBA73] hover:shadow-[0_0_15px_rgba(227,168,87,0.3)] shadow-md'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
              }`}
              title={product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            >
              {isAdded ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : product.in_stock ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">🚫</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <QuantityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        onConfirm={handleConfirmAdd}
      />
    </>
  );
};

export default ProductCard;
