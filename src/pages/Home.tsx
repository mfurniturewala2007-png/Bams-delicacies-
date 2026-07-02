import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedCarousel from '../components/FeaturedCarousel';
import MenuGrid from '../components/MenuGrid';
import CartSidebar from '../components/CartSidebar';
import Footer from '../components/Footer';
import ArtisanDivider from '../components/ArtisanDivider';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ScrollFloat from '../components/ScrollFloat';

const Home: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalCount } = useCart();
  const { profile, openAuthModalWithRedirect } = useAuth();
  const navigate = useNavigate();

  const handleOrderNow = () => {
    if (totalCount === 0) {
      // No items — scroll to menu to browse
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!profile) {
      openAuthModalWithRedirect('/checkout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-bg text-text relative">
      {/* 1. Header glassmorphism Navigation */}
      <Navbar onCartOpen={() => setIsCartOpen(true)} />

      {/* 2. Dynamic Hero Landing Page */}
      <Hero />

      <ArtisanDivider icon="spice" className="px-6" />

      {/* 3. Featured Products Horizontal Carousel */}
      <FeaturedCarousel />

      <ArtisanDivider icon="star" className="px-6" />

      {/* 4. Supabase connected Menu Grid listing */}
      <MenuGrid />

      <ArtisanDivider icon="leaf" className="px-6" />

      {/* 5. Ready to Order — CTA card linking to /checkout */}
      <section id="order" className="py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <ScrollFloat
            as="p"
            containerClassName="font-serif italic text-accent-dim text-base mb-2"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center+=20%"
          >
            — almost there —
          </ScrollFloat>
          <ScrollFloat
            containerClassName="font-serif font-black text-3xl sm:text-4xl text-heading mb-4"
            scrollStart="top bottom-=10%"
            scrollEnd="bottom center+=20%"
          >
            Ready to Place Your Order?
          </ScrollFloat>
          <p className="text-muted font-sans text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            {totalCount > 0
              ? `You have ${totalCount} dozen${totalCount !== 1 ? 's' : ''} in your cart. Head to checkout to confirm your delivery date and payment.`
              : 'Browse the menu above, add your favourite items to the cart, then come back here to checkout.'}
          </p>

          <button
            onClick={handleOrderNow}
            className="inline-flex items-center gap-3 bg-primary text-white font-sans font-black text-base px-8 py-4 rounded-full shadow-primary hover:bg-primary-hover hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            <span>{totalCount > 0 ? '🛒 Proceed to Checkout' : '🍽️ Browse Menu'}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {totalCount > 0 && (
            <p className="text-xs text-muted mt-4 font-sans">
              Or open the <button onClick={() => setIsCartOpen(true)} className="underline text-accent hover:text-accent-dim transition-colors">cart</button> to review your items first.
            </p>
          )}
        </div>
      </section>

      {/* 6. Slide-in Cart Sidebar Panel Drawer overlay */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Reusable Footer Component */}
      <Footer />
    </div>
  );
};

export default Home;
