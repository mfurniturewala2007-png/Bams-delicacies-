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

  const handleAddToCart = () => {
    // Add item to CartContext with quantity 1
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    }, 1);

    // Toggle visual feedback state
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div
      className="bg-surface rounded-2xl border border-border hover:border-yellow shadow-card hover:shadow-yellow hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden opacity-0 animate-fade-slide-up"
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
              // Graceful fallback to emoji avatar if source load errors out
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
          <span className="absolute top-4 right-4 bg-bg/85 backdrop-blur-md border border-border text-yellow text-xs font-semibold px-3 py-1 rounded-full shadow-md capitalize">
            {product.category}
          </span>
        )}
      </div>

      {/* Card Details Body */}
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          {/* Product Name */}
          <h3 className="font-sans font-bold text-lg text-white/95 leading-snug group-hover:text-yellow transition-colors duration-200">
            {product.name}
          </h3>

          {/* Description line-clamped */}
          <p className="font-sans font-medium text-muted text-sm mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {product.description || 'Prepared fresh with finest ingredients. Delivered clean and hot.'}
          </p>
        </div>

        {/* Price & Purchase CTA */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-semibold text-yellow">
              ₹{product.price}
            </span>
            <span className="text-muted text-xs font-sans">/ serving</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className={`w-full py-3.5 px-6 rounded-full font-sans font-bold text-sm tracking-wide shadow-md transition-all duration-300 flex items-center justify-center gap-2 select-none ${
              !product.in_stock
                ? 'bg-surface-2 text-muted/50 border border-border cursor-not-allowed shadow-none'
                : isAdded
                ? 'bg-success text-bg font-extrabold hover:scale-100 shadow-yellow'
                : 'bg-yellow text-bg hover:bg-yellow-dim hover:scale-[1.03] hover:shadow-yellow-strong active:scale-95'
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
  );
};

export default ProductCard;
