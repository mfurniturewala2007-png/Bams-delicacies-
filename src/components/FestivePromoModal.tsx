import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const FestivePromoModal: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFestivalActive, setIsFestivalActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkFestivalAndSession = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'festival_deal_enabled')
          .maybeSingle();

        const active = !data || data.value !== 'false';
        setIsFestivalActive(active);

        // Open popup only if festival deal is enabled, user is logged in, and not shown yet in this session
        if (active && profile) {
          const shown = sessionStorage.getItem('bams_festive_promo_shown');
          if (!shown) {
            // Delay slightly for premium landing feel
            timer = setTimeout(() => setIsOpen(true), 1500);
          }
        }
      } catch (err) {
        console.warn('Failed to verify festival deal settings:', err);
      }
    };

    checkFestivalAndSession();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [profile]);

  if (!isOpen || !isFestivalActive) return null;

  const handleClose = () => {
    sessionStorage.setItem('bams_festive_promo_shown', 'true');
    setIsOpen(false);
  };

  const handleExplore = () => {
    sessionStorage.setItem('bams_festive_promo_shown', 'true');
    setIsOpen(false);
    navigate('/pheli-raat');
  };

  const combos = [
    {
      title: 'Combo 1',
      price: 400,
      items: ['Chicken Keema Samosa ×4', 'Chicken Shami Kabab ×4', 'Mutton Keema Pattice ×4']
    },
    {
      title: 'Combo 2',
      price: 460,
      items: ['Smoked Dal Samosa ×4', 'Chicken Cream Tikka ×4', 'Mutton Shami Kabab ×4']
    },
    {
      title: 'Combo 3',
      price: 500,
      items: ['Mutton Keema Samosa ×4', 'Chicken Cream Tikka ×4', 'Mutton Keema Pattice ×4']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-text">
      {/* Dimmed glassmorphism backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-[#0D0D0D]/85 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Starry Festive Card Container */}
      <div
        className="relative z-10 w-full bg-gradient-to-b from-[#150F0A] via-[#201710] to-[#0E0A07] border border-[#DFBA73]/30 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center gap-6 animate-fade-slide-up select-text max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: '460px' }}
      >
        {/* Background stars animations */}
        <style>{`
          @keyframes glow-festive {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(223, 186, 115, 0.4)); }
            50% { filter: drop-shadow(0 0 15px rgba(223, 186, 115, 0.8)); }
          }
          .lantern-glow {
            animation: glow-festive 3s infinite ease-in-out;
          }
        `}</style>

        {/* Close Cross — 44px touch target */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl bg-[#2D1F15] border border-[#DFBA73]/15 text-[#FFF8EE]/80 hover:text-[#E3A857] hover:border-[#DFBA73]/40 active:scale-95 transition-all duration-200"
          aria-label="Close Promo"
        >
          ✕
        </button>

        {/* Floating elements */}
        <div className="flex items-center gap-2">
          <span className="text-3xl lantern-glow">🌙</span>
          <span className="bg-[#E3A857]/10 border border-[#E3A857]/30 text-[#E3A857] text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
            Limited-Time Special
          </span>
          <span className="text-3xl lantern-glow">✨</span>
        </div>

        <div>
          <h2 className="font-serif font-black text-2xl md:text-3xl text-[#DFBA73] leading-tight tracking-tight">
            Pheli Raat Combos!
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 rounded-full" />
          <p className="font-sans text-xs text-[#FFF8EE]/80 mt-2.5 max-w-sm">
            Celebrate the festival night with Mom's handcrafted gourmet combos. Order now for delivery on <span className="text-[#E3A857] font-bold">June 12th</span>!
          </p>
        </div>

        {/* Combo Cards Grid */}
        <div className="w-full space-y-3.5 my-2">
          {combos.map((combo) => (
            <div
              key={combo.title}
              className="bg-[#1D1510]/80 border border-[#DFBA73]/10 p-3.5 rounded-2xl flex flex-col justify-between text-left gap-2 hover:border-[#DFBA73]/30 transition-colors duration-250"
            >
              <div className="flex items-baseline justify-between">
                <h4 className="font-serif font-black text-sm text-[#FFFAF4]">
                  {combo.title}
                </h4>
                <span className="font-serif font-black text-[#E3A857] text-sm">
                  ₹{combo.price}
                </span>
              </div>
              <div className="text-xs text-[#FFF8EE]/70 font-sans leading-relaxed">
                {combo.items.join('  ·  ')}
              </div>
            </div>
          ))}
        </div>

        {/* Pulse Interactive Action Button */}
        <button
          onClick={handleExplore}
          className="w-full py-4 bg-gradient-to-r from-primary to-[#E3A857] hover:scale-[1.02] active:scale-98 transition-all text-white font-sans font-black text-sm uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(227,168,87,0.2)] select-none focus:outline-none animate-pulse-glow"
        >
          Explore Festive Menu 🍽️
        </button>
      </div>
    </div>
  );
};

export default FestivePromoModal;
