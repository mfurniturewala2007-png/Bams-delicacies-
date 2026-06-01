import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { supabase } from '../utils/supabase';
import { useCart } from '../context/CartContext';
import QuantityModal from './QuantityModal';

const FeaturedCarousel: React.FC = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch featured products on mount
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        // Query products where is_featured is true
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

  // 2. Smooth Continuous Auto-scroll: glides 1px every 25ms, pauses on hover
  useEffect(() => {
    if (products.length === 0 || isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        
        // If we have scrolled to the end, wrap back to the beginning
        if (scrollLeft + clientWidth >= scrollWidth - 2) {
          scrollRef.current.scrollLeft = 0;
        } else {
          scrollRef.current.scrollLeft += 1;
        }
      }
    }, 25); // ~40 FPS smooth continuous glide

    return () => clearInterval(interval);
  }, [products, isHovered]);

  // 3. Arrow buttons scroll by card size (245px) with smooth transition
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 240; // Card width + gap
      const target = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollRef.current.scrollTo({
        left: target,
        behavior: 'smooth',
      });
    }
  };

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

  // If loading or no featured products exist, render nothing (no placeholder/empty state)
  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 md:px-12 bg-bg border-b border-border/40 relative overflow-hidden select-none animate-page-fade">
      {/* Hide scrollbars for the carousel */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header Block: Playfair Display "Featured Delicacies" */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="font-serif font-black text-3xl md:text-5xl text-heading tracking-tight">
              Featured Delicacies
            </h2>
            <div className="w-16 h-1 bg-primary mt-3 rounded-full shadow-primary" />
          </div>

          {/* Navigation Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-border bg-surface text-text flex items-center justify-center hover:border-primary hover:text-primary active:scale-90 transition-all duration-200 shadow-md"
              title="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-border bg-surface text-text flex items-center justify-center hover:border-primary hover:text-primary active:scale-90 transition-all duration-200 shadow-md"
              title="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Outer Wrapper */}
        <div className="relative w-full overflow-hidden">
          {/* Scrolling horizontal container */}
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-6 overflow-x-auto no-scrollbar pb-4"
          >
            {products.map((prod) => (
              <div
                key={prod.id}
                className="w-[220px] flex-shrink-0 bg-surface border border-border hover:border-primary hover:shadow-yellow hover:-translate-y-1.5 transition-all duration-300"
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div>
                  {/* Aspect Square Image Cover */}
                  <div className="relative aspect-square w-full bg-surface-2 rounded-xl overflow-hidden mb-3 border border-border">
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
                      <span className="text-4xl">🍽️</span>
                    </div>

                    {/* Category badge */}
                    {prod.category && (
                      <span className="absolute top-2.5 right-2.5 bg-bg/85 backdrop-blur-md border border-border text-primary text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        {prod.category}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="font-sans font-bold text-sm text-heading leading-snug line-clamp-1 mb-1 text-left">
                    {prod.name}
                  </h3>
                </div>

                {/* Bottom CTA & Pricing */}
                <div className="mt-2 text-left">
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-serif text-lg font-black text-yellow">
                      ₹{prod.price}
                    </span>
                    <span className="text-muted text-[10px] font-sans">
                      / {prod.unit_label || '12 pcs'}
                    </span>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => handleAddClick(prod)}
                    className="w-full py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white font-sans font-extrabold text-xs rounded-full shadow-md transition-all duration-200 select-none flex items-center justify-center gap-1.5"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            ))}
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
