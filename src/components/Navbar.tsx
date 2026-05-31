import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onCartOpen: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCartOpen }) => {
  const { totalCount, lastAddedAt } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Trigger badge bounce animation whenever an item is added
  useEffect(() => {
    if (!lastAddedAt || !badgeRef.current) return;
    const el = badgeRef.current;
    el.classList.remove('animate-badge-bounce');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('animate-badge-bounce');
    const timer = setTimeout(() => el.classList.remove('animate-badge-bounce'), 400);
    return () => clearTimeout(timer);
  }, [lastAddedAt]);

  // Handle scroll detection for glassmorphism backdrop shift
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Menu', href: '#menu' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Order Now', href: '#order' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 h-20 border-b ${
        isScrolled
          ? 'bg-bg/95 backdrop-blur-md border-border/80 shadow-lg'
          : 'bg-bg border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <a href="#" className="flex items-center gap-3 group">
          <img src="/logo.jpeg" alt="Bam's Delicacies" style={{ height: '40px' }} />
          <span className="font-serif font-black text-xl md:text-2xl text-heading tracking-tight group-hover:text-primary transition-colors duration-200">
            Bam's Delicacies
          </span>
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-sans font-medium text-text/90 hover:text-primary transition-colors duration-200 text-sm tracking-wide uppercase"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Cart Button & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          {/* Cart Icon Toggle Button */}
          <button
            onClick={onCartOpen}
            className="relative p-2.5 rounded-full bg-surface-2 border border-border text-text hover:text-primary hover:border-primary hover:scale-105 transition-all duration-200 focus:outline-none"
            aria-label="Open Shopping Cart"
          >
            {/* SVG Shopping Cart Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>

            {/* Redesigned Orange Item Count Badge */}
            {totalCount > 0 && (
              <span
                ref={badgeRef}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary text-white font-sans font-bold text-xs rounded-full flex items-center justify-center border border-bg shadow-primary"
              >
                {totalCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-surface-2 border border-border text-text hover:text-primary hover:border-primary focus:outline-none transition-all duration-200"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              // Close Icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger Icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-surface border-b border-border shadow-2xl py-6 px-4 flex flex-col gap-4 animate-fade-slide-up md:hidden z-40">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={handleLinkClick}
              className="font-sans font-medium text-text/90 hover:text-primary hover:bg-surface-2 px-4 py-3 rounded-xl transition-all duration-200 text-base border border-transparent hover:border-border"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
