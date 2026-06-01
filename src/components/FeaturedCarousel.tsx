import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '../utils/supabase';
import { useCart } from '../context/CartContext';
import QuantityModal from './QuantityModal';

const FeaturedCard: React.FC<{ prod: Product; onAddClick: (p: Product) => void }> = ({ prod, onAddClick }) => {
  return (
    <div
      className="w-[160px] flex-shrink-0 bg-surface border border-border/40 hover:border-primary/50 hover:shadow-yellow hover:-translate-y-1.5 transition-all duration-300 rounded-2xl p-2.5 flex flex-col justify-between"
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div>
        {/* Aspect Square Image Cover */}
        <div className="relative aspect-square w-full bg-surface-2 rounded-xl overflow-hidden mb-2.5 border border-border/40">
          {prod.image_url ? (
            <img
              src={prod.image_url}
              alt={prod.name}
              className="w-full h-full object-cover animate-fade-slide-up"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fb = e.currentTarget.nextElementSibling as HTMLDivElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback plate emoji */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-surface-2 text-muted"
            style={{ display: prod.image_url ? 'none' : 'flex' }}
          >
            <span className="text-2xl">🍽️</span>
          </div>

          {/* Category badge */}
          {prod.category && (
            <span className="absolute top-2 right-2 bg-bg/85 backdrop-blur-md border border-border/40 text-primary text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              {prod.category}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-sans font-bold text-[11px] sm:text-xs text-heading leading-snug line-clamp-1 mb-1 text-left">
          {prod.name}
        </h3>
      </div>

      {/* Bottom CTA & Pricing: Price on left, Floating Plus circle on right */}
      <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-border/20 pt-2">
        <div className="flex flex-col text-left">
          <span className="font-serif text-sm sm:text-base font-black text-yellow leading-tight">
            ₹{prod.price}
          </span>
          <span className="text-muted text-[8px] sm:text-[9px] font-sans mt-0.5">
            / {prod.unit_label || '12 pcs'}
          </span>
        </div>

        {/* Add button */}
        <button
          onClick={() => onAddClick(prod)}
          className="w-7 h-7 rounded-full bg-primary hover:bg-primary-hover active:scale-90 text-white flex items-center justify-center shadow-md shadow-primary/20 transition-all duration-200 select-none focus:outline-none flex-shrink-0"
          title="Add to Cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const FeaturedCarousel: React.FC = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 1. Fetch featured products on mount
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setProducts(data);
        }
      } catch (err) {
        console.warn('Failed to load featured products from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleAddClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleConfirmAdd = (dozens: number) => {
    if (!selectedProduct) return;
    addItem({
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      price_per_dozen: selectedProduct.price,
      dozens: dozens,
      image_url: selectedProduct.image_url || '',
      category: selectedProduct.category || '',
    });
    setIsModalOpen(false);
  };

  // If loading or no featured products exist, render nothing
  if (loading || products.length === 0) {
    return null;
  }

  // Adjust marquee speed dynamically based on the number of products (more products = longer track = needs slightly longer time to look consistent)
  const marqueeSpeed = `${Math.max(15, products.length * 6)}s`;

  return (
    <section className="py-12 px-4 md:px-12 bg-bg border-b border-border/40 relative overflow-hidden select-none animate-page-fade">
      {/* CSS infinite marquee rules */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-track {
          display: flex;
          gap: 1rem; /* gap-4 = 16px */
          width: max-content;
          animation: marquee ${marqueeSpeed} linear infinite;
        }
        .animate-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="text-left mb-8">
          <h2 className="font-serif font-black text-3xl md:text-5xl text-heading tracking-tight">
            Featured Delicacies
          </h2>
          <div className="w-16 h-1 bg-primary mt-3 rounded-full shadow-primary" />
        </div>

        {/* Carousel Outer Wrapper */}
        <div className="relative w-full overflow-hidden">
          {/* Scrolling horizontal container (Pure CSS Infinite Loop) */}
          <div className="animate-marquee-track pb-4">
            {/* Track 1 */}
            <div className="flex gap-4 shrink-0">
              {products.map((prod) => (
                <FeaturedCard key={`track1-${prod.id}`} prod={prod} onAddClick={handleAddClick} />
              ))}
            </div>
            {/* Track 2 (Duplicate for seamless loop) */}
            <div className="flex gap-4 shrink-0" aria-hidden="true">
              {products.map((prod) => (
                <FeaturedCard key={`track2-${prod.id}`} prod={prod} onAddClick={handleAddClick} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Quantity Modal popup */}
      {selectedProduct && (
        <QuantityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          onConfirm={handleConfirmAdd}
        />
      )}
    </section>
  );
};

export default FeaturedCarousel;
