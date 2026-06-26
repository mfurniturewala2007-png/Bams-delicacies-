import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import QuantityModal from './QuantityModal';

interface ProductCardProps {
  product: Product;
  index?: number; // kept for API compatibility but no longer used
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
        className="rounded-2xl border transition-all duration-300 flex flex-col justify-between group overflow-hidden bg-surface border-border/40 md:hover:border-primary/50 md:hover:shadow-yellow md:hover:-translate-y-1.5"
      >
        {/* Product Image Cover (Aspect 4:3 Ratio for modern layouts) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b bg-surface-2 border-border/40">
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
            className="absolute inset-0 flex flex-col items-center justify-center text-muted bg-surface-2"
            style={{ display: product.image_url ? 'none' : 'flex' }}
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
            <span className="text-[10px] font-sans mt-2 text-muted/65">Homemade Delicacy</span>
          </div>

          {/* Dynamic Category Pill Badge */}
          {product.category && (
            <span className="absolute top-3 right-3 backdrop-blur-md border text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm capitalize bg-bg/85 border-border/40 text-primary">
              {product.category}
            </span>
          )}
        </div>

        {/* Card Details Body */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between">
          <div className="text-left">
            {/* Product Name */}
            <h3 className="font-sans font-bold text-sm leading-snug transition-colors duration-200 tracking-tight line-clamp-2 text-heading group-hover:text-primary">
              {product.name}
            </h3>

            {/* Description line-clamped */}
            <p className="font-sans font-medium text-xs mt-1.5 line-clamp-2 min-h-[2rem] leading-relaxed text-muted">
              {product.description || 'Prepared fresh with finest ingredients. Delivered clean and hot.'}
            </p>
          </div>

          {/* Modern Snappy Bottom Row: Price on left, Floating Add circle on right */}
          <div className="mt-3 flex items-center justify-between gap-2 text-left border-t pt-2.5 border-border/20">
            <div className="flex flex-col">
              <span className="font-serif text-lg font-black text-yellow leading-tight">
                ₹{product.price}
              </span>
              <span className="text-[10px] font-sans mt-0.5 text-muted">
                per {product.unit_label || '12 pcs'}
              </span>
            </div>

            <button
              onClick={handleOpenModal}
              disabled={!product.in_stock}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 md:hover:scale-[1.08] active:scale-90 select-none flex-shrink-0 focus:outline-none ${
                !product.in_stock
                  ? 'bg-surface-2 text-muted/40 border border-border/60 cursor-not-allowed shadow-none'
                  : isAdded
                  ? 'bg-success text-white'
                  : 'bg-primary text-white md:hover:bg-primary-hover shadow-primary/20'
              }`}
              title={product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            >
              {isAdded ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : product.in_stock ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
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
