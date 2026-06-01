import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import FeaturedCarousel from '../components/FeaturedCarousel';
import MenuGrid from '../components/MenuGrid';
import OrderForm from '../components/OrderForm';
import CartSidebar from '../components/CartSidebar';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text relative">
      {/* 1. Header glassmorphism Navigation */}
      <Navbar onCartOpen={() => setIsCartOpen(true)} />

      {/* 2. Dynamic Hero Landing Page */}
      <Hero />

      {/* 3. Stagger-animated How It Works explainer */}
      <HowItWorks />

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
    </div>
  );
};

export default Home;
