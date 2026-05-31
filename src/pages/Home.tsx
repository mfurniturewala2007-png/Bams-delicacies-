import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import MenuGrid from '../components/MenuGrid';
import OrderForm from '../components/OrderForm';
import CartSidebar from '../components/CartSidebar';

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

      {/* 4. Supabase connected Menu Grid listing */}
      <MenuGrid />

      {/* 5. Complete Order input form section */}
      <OrderForm />

      {/* 6. Slide-in Cart Sidebar Panel Drawer overlay */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer Branding Area */}
      <footer className="bg-surface border-t border-border py-12 px-6 text-center text-muted text-sm font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Bam's Delicacies"
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
            <span className="font-serif font-black text-heading text-lg tracking-tight">
              Bam's Delicacies
            </span>
          </div>
          <p className="md:order-last text-xs">
            © {new Date().getFullYear()} Bam's Delicacies. All rights reserved.
          </p>
          <div className="flex gap-6 text-text/70">
            <a href="#how-it-works" className="hover:text-primary transition-colors duration-200">About</a>
            <a href="#menu" className="hover:text-primary transition-colors duration-200">Our Menu</a>
            <a href="#order" className="hover:text-primary transition-colors duration-200">Order Online</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
