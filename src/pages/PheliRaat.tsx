import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import OrderForm from '../components/OrderForm';
import CartSidebar from '../components/CartSidebar';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const PheliRaat: React.FC = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  
  // Navigation drawer & redirects
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Festival configurations
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [deliveryDateStr, setDeliveryDateStr] = useState('June 12, 2026');
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  // 1. Fetch configs and Pheli Raat products
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);

        // Fetch settings
        const { data: settings } = await supabase
          .from('settings')
          .select('*')
          .in('key', ['festival_deal_enabled', 'festival_deal_end_date', 'festival_deal_delivery_date']);

        if (settings) {
          const enabled = settings.find(r => r.key === 'festival_deal_enabled')?.value !== 'false';
          const endStr = settings.find(r => r.key === 'festival_deal_end_date')?.value || '2026-06-10T23:59:59';
          const delivStr = settings.find(r => r.key === 'festival_deal_delivery_date')?.value || '2026-06-12';

          if (!enabled) {
            // Silently redirect to home if promotion is disabled
            navigate('/');
            return;
          }

          setEndTime(new Date(endStr));
          
          // Format delivery date nicely for UI
          const dateParts = delivStr.split('-');
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const day = parseInt(dateParts[2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              const dateObj = new Date(year, month, day);
              if (!isNaN(dateObj.getTime())) {
                setDeliveryDateStr(dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
              } else {
                setDeliveryDateStr(delivStr);
              }
            } else {
              setDeliveryDateStr(delivStr);
            }
          } else {
            setDeliveryDateStr(delivStr);
          }
        }

        // Fetch festival combo products
        const { data: prods, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'Pheli Raat')
          .eq('in_stock', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (prods && prods.length > 0) {
          setProducts(prods);
        } else {
          setProducts([]);
        }

      } catch (err) {
        console.warn('Failed to load Pheli Raat page data. Using defaults.');
        setEndTime(new Date('2026-06-10T23:59:59'));
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  // 2. Real-time countdown timer ticker
  useEffect(() => {
    if (!endTime) return;

    const calculateTime = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      setIsExpired(false);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const handleCheckoutScroll = () => {
    const checkoutEl = document.getElementById('checkout-festive');
    if (checkoutEl) {
      checkoutEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0705] via-[#140F0A] to-[#050302] text-[#FFF8EE] relative select-text">
      
      {/* Decorative Starry Styles */}
      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .star {
          position: absolute;
          background-color: #DFBA73;
          border-radius: 50%;
          animation: sparkle 3s infinite ease-in-out;
        }
        .star-slow {
          animation-duration: 5s;
        }
        .star-fast {
          animation-duration: 2s;
        }
        .glow-accent {
          box-shadow: 0 0 40px rgba(223, 186, 115, 0.12);
        }
      `}</style>

      {/* Decorative Stars in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-65">
        <div className="star star-fast w-1 h-1 top-[10%] left-[15%]" />
        <div className="star star-slow w-1.5 h-1.5 top-[18%] left-[75%]" />
        <div className="star w-1.5 h-1.5 top-[30%] left-[45%]" />
        <div className="star star-fast w-1 h-1 top-[55%] left-[80%]" />
        <div className="star star-slow w-2 h-2 top-[70%] left-[10%]" />
        <div className="star w-1 h-1 top-[85%] left-[60%]" />
      </div>

      {/* 1. Transparent Floating Navigation Bar */}
      <Navbar onCartOpen={() => setIsCartOpen(true)} />

      {/* Spacer to push content past fixed Navbar */}
      <div className="h-20" />

      {/* 2. Festive Hero Header Section */}
      <header className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center flex flex-col items-center gap-6 relative z-10 animate-page-fade">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-pulse">🌙</span>
          <span className="bg-gradient-to-r from-[#DFBA73] via-[#E3A857] to-[#DFBA73] bg-clip-text font-sans font-bold text-xs uppercase tracking-widest border border-[#DFBA73]/20 px-3.5 py-1 rounded-full shadow-[0_0_15px_rgba(223,186,115,0.1)]">
            Celebratory Offer
          </span>
          <span className="text-4xl animate-pulse">✨</span>
        </div>
        
        <div className="space-y-4">
          <h1 className="font-serif font-black text-4xl sm:text-6xl text-transparent bg-gradient-to-r from-[#DFBA73] via-[#E3A857] to-[#DFBA73] bg-clip-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tracking-tight leading-tight">
            Pheli Raat Combos
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed text-[#FFFAF4]/85">
            Make the festival unforgettable! Share Mom's homemade luxury recipes with your loved ones. Prepared fresh in special batches for delivery on <span className="text-[#E3A857] font-black">{deliveryDateStr}</span>.
          </p>
        </div>

        {/* Live Expiration Countdown Timer Box */}
        <div className="w-full max-w-[480px] bg-[#150F0A]/95 border border-[#DFBA73]/20 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-md relative mt-4 select-none">
          {/* Subtle Lantern decorations */}
          <span className="absolute -top-4 -left-3 text-2xl opacity-60">🏮</span>
          <span className="absolute -top-4 -right-3 text-2xl opacity-60">🏮</span>

          <h4 className="font-sans font-extrabold text-xs text-[#E3A857]/90 uppercase tracking-widest mb-3">
            {isExpired ? 'Booking State' : '🚨 Booking Closes In:'}
          </h4>

          {isExpired ? (
            <div className="py-2">
              <p className="font-serif font-bold text-base text-[#E3A857] mb-1 animate-pulse">
                Booking has closed! 🎉
              </p>
              <p className="text-xs text-[#FFFAF4]/70">
                We are actively preparing gourmet batches for your celebratory deliveries.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center select-none pt-1">
              <div className="flex flex-col p-2 bg-[#201710]/90 border border-[#DFBA73]/15 rounded-2xl">
                <span className="font-serif font-black text-xl md:text-2xl text-[#E3A857]">{timeLeft.days}</span>
                <span className="text-[9px] uppercase font-bold text-[#FFFAF4]/60 mt-0.5">Days</span>
              </div>
              <div className="flex flex-col p-2 bg-[#201710]/90 border border-[#DFBA73]/15 rounded-2xl">
                <span className="font-serif font-black text-xl md:text-2xl text-[#E3A857]">{timeLeft.hours}</span>
                <span className="text-[9px] uppercase font-bold text-[#FFFAF4]/60 mt-0.5">Hours</span>
              </div>
              <div className="flex flex-col p-2 bg-[#201710]/90 border border-[#DFBA73]/15 rounded-2xl">
                <span className="font-serif font-black text-xl md:text-2xl text-[#E3A857]">{timeLeft.minutes}</span>
                <span className="text-[9px] uppercase font-bold text-[#FFFAF4]/60 mt-0.5">Mins</span>
              </div>
              <div className="flex flex-col p-2 bg-[#201710]/90 border border-[#DFBA73]/15 rounded-2xl">
                <span className="font-serif font-black text-xl md:text-2xl text-[#E3A857]">{timeLeft.seconds}</span>
                <span className="text-[9px] uppercase font-bold text-[#FFFAF4]/60 mt-0.5">Secs</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3. Main Products Menu Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-sm md:max-w-4xl mx-auto justify-center">
            <div className="bg-[#150F0A]/50 border border-[#DFBA73]/10 rounded-2xl p-4 h-[330px] animate-pulse" />
            <div className="bg-[#150F0A]/50 border border-[#DFBA73]/10 rounded-2xl p-4 h-[330px] animate-pulse" />
            <div className="bg-[#150F0A]/50 border border-[#DFBA73]/10 rounded-2xl p-4 h-[330px] animate-pulse" />
          </div>
        ) : products.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-sm md:max-w-4xl mx-auto justify-center">
              {products.map((product, idx) => (
                <div key={product.id} className="relative group">
                  {/* Subtle golden saffron glowing card halo wrapper */}
                  <div className="absolute inset-0 bg-[#DFBA73] rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-all duration-300 pointer-events-none" />
                  
                  {/* Render compact product card directly in dark mode */}
                  <ProductCard product={product} index={idx} isDark={true} />
                </div>
              ))}
            </div>

            {/* Quick Sticky Scroll CTA */}
            {items.length > 0 && !isExpired && (
              <div className="mt-12 text-center animate-fade-slide-up">
                <button
                  onClick={handleCheckoutScroll}
                  className="bg-gradient-to-r from-primary to-[#E3A857] text-white font-sans font-black text-sm uppercase tracking-wider px-8 py-4 rounded-full shadow-[0_0_20px_rgba(227,168,87,0.2)] hover:scale-[1.03] active:scale-95 transition-all duration-300"
                >
                  Proceed to Festive Booking ({items.length} items) 🎉
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-[#DFBA73]/20 rounded-3xl bg-[#150F0A]/40">
            <span className="text-4xl animate-bounce">🥘</span>
            <h3 className="font-serif font-bold text-xl text-[#E3A857] mt-4">Menu Loading</h3>
            <p className="text-[#FFFAF4]/60 text-xs mt-1.5">Bam's Delicacies is preparing premium Pheli Raat combinations shortly.</p>
          </div>
        )}
      </section>

      {/* 4. Complete Festive Order Form Booking Section */}
      <section id="checkout-festive" className="max-w-6xl mx-auto px-4 py-16 relative z-10 border-t border-[#DFBA73]/10">
        <div className="text-center mb-8">
          <h2 className="font-serif font-black text-3xl text-[#DFBA73] tracking-tight">Complete Celebration Booking</h2>
          <p className="text-[#FFFAF4]/60 text-xs mt-2">Enter your delivery details below to reserve your slot for {deliveryDateStr}.</p>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 rounded-full" />
        </div>

        {/* Render fully locked OrderForm */}
        <div className="bg-[#150F0A]/40 border border-[#DFBA73]/15 p-5 md:p-8 rounded-3xl shadow-2xl relative select-text text-text">
          {items.length === 0 ? (
            <div className="text-center py-12 text-[#FFFAF4]">
              <span className="text-4xl">🛒</span>
              <h3 className="font-serif font-bold text-lg text-[#E3A857] mt-4">Your Shopping Cart is Empty</h3>
              <p className="text-[#FFFAF4]/60 text-xs mt-1">Please add at least one celebration combo above to book your order.</p>
            </div>
          ) : isExpired ? (
            <div className="text-center py-12 text-[#FFFAF4]">
              <span className="text-4xl">🔒</span>
              <h3 className="font-serif font-bold text-lg text-[#E3A857] mt-4">Celebration Booking Closed</h3>
              <p className="text-[#FFFAF4]/60 text-xs mt-1">The deadline for ordering Pheli Raat combos has passed. Thank you!</p>
            </div>
          ) : (
            <OrderForm isDark={true} />
          )}
        </div>
      </section>

      {/* Reusable Footer Component */}
      <Footer />

      {/* Cart Drawer Panel overlay */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default PheliRaat;
