import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dozens, setDozens] = useState(1);

  const handleOpenModal = () => {
    if (!product.in_stock) return;
    setDozens(1);
    setIsModalOpen(true);
  };

  const handleConfirmAdd = () => {
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
        className="bg-surface rounded-2xl border border-border hover:border-primary shadow-card hover:shadow-primary hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden opacity-0 animate-fade-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Product Image Cover (Aspect Square) */}
        <div className="relative aspect-square w-full bg-surface-2 overflow-hidden border-b border-border">
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
            className="absolute inset-0 flex flex-col items-center justify-center bg-surface-2 text-muted"
            style={{ display: product.image_url ? 'none' : 'flex' }}
          >
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
            <span className="text-xs text-muted/65 font-sans mt-3">Homemade Delicacy</span>
          </div>

          {/* Dynamic Category Pill Badge */}
          {product.category && (
            <span className="absolute top-4 right-4 bg-bg/85 backdrop-blur-md border border-border text-primary text-xs font-semibold px-3 py-1 rounded-full shadow-md capitalize">
              {product.category}
            </span>
          )}
        </div>

        {/* Card Details Body */}
        <div className="p-4 md:p-6 flex flex-col flex-grow justify-between">
          <div className="text-left">
            {/* Product Name */}
            <h3 className="font-sans font-bold text-lg text-heading leading-snug group-hover:text-primary transition-colors duration-200">
              {product.name}
            </h3>

            {/* Description line-clamped */}
            <p className="font-sans font-medium text-muted text-sm mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed">
              {product.description || 'Prepared fresh with finest ingredients. Delivered clean and hot.'}
            </p>
          </div>

          {/* Price & Purchase CTA */}
          <div className="mt-4 md:mt-6 flex flex-col gap-4 text-left">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-semibold text-yellow">
                ₹{product.price}
              </span>
              <span className="text-muted text-xs font-sans">
                / dozen ({product.unit_label || '12 pcs'})
              </span>
            </div>

            <button
              onClick={handleOpenModal}
              disabled={!product.in_stock}
              className={`w-full py-3.5 px-6 rounded-full font-sans font-bold text-sm tracking-wide shadow-md transition-all duration-300 flex items-center justify-center gap-2 select-none ${
                !product.in_stock
                  ? 'bg-surface-2 text-muted/50 border border-border cursor-not-allowed shadow-none'
                  : isAdded
                  ? 'bg-success text-white font-extrabold hover:scale-100 shadow-primary'
                  : 'bg-primary text-white hover:bg-primary-hover hover:scale-[1.03] hover:shadow-primary-strong active:scale-95'
              }`}
            >
              {isAdded ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>✓ Added!</span>
                </>
              ) : product.in_stock ? (
                <span>Add to Cart</span>
              ) : (
                <span>Out of Stock</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gourmet Dozen Selection Modal Popup Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-text">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
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
                onClick={() => setIsModalOpen(false)}
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
        </div>
      )}
    </>
  );
};

export default ProductCard;
