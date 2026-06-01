import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorksModal from '../components/HowItWorksModal';
import FeaturedCarousel from '../components/FeaturedCarousel';
import MenuGrid from '../components/MenuGrid';
import OrderForm from '../components/OrderForm';
import CartSidebar from '../components/CartSidebar';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('bams_explainer_shown');
    if (!shown) {
      setIsExplainerOpen(true);
    }
  }, []);

  const handleExplainerClose = () => {
    sessionStorage.setItem('bams_explainer_shown', 'true');
    setIsExplainerOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text relative">
      {/* 1. Header glassmorphism Navigation */}
      <Navbar onCartOpen={() => setIsCartOpen(true)} />

      {/* 2. Dynamic Hero Landing Page */}
      <Hero />

      {/* 4. Featured Products Horizontal Carousel */}
      <FeaturedCarousel />

      {/* 5. Supabase connected Menu Grid listing */}
      <MenuGrid />

      {/* 5. Complete Order input form section */}
      <OrderForm />

      {/* 6. Slide-in Cart Sidebar Panel Drawer overlay */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Reusable Footer Component */}
      <Footer />

      {/* "How It Works" Pop-up Modal */}
      <HowItWorksModal isOpen={isExplainerOpen} onClose={handleExplainerClose} />
    </div>
  );
};

export default Home;
