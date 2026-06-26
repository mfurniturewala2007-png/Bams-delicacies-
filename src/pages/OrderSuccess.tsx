import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();

  // Auto-redirect to home after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => navigate('/'), 8000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-bg text-text">
      {/* Animated check circle */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-fade-slide-up bg-primary/10 border-2 border-primary"
      >
        <span className="text-5xl">🎉</span>
      </div>

      <h1
        className="text-3xl font-black mb-3 animate-fade-slide-up text-heading"
        style={{
          animationDelay: '0.05s',
        }}
      >
        Order Placed!
      </h1>

      <p
        className="text-base max-w-xs leading-relaxed mb-2 animate-fade-slide-up text-text"
        style={{ animationDelay: '0.1s' }}
      >
        Your order has been received. We'll confirm delivery details via WhatsApp or phone.
      </p>

      <p
        className="text-sm mb-10 animate-fade-slide-up text-muted"
        style={{ animationDelay: '0.15s' }}
      >
        Redirecting to home in a few seconds…
      </p>

      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 rounded-lg font-bold text-lg tracking-wide transition-all duration-200 animate-fade-slide-up bg-[#F5C200] text-[#1E1E1E] hover:bg-[#C49A00] shadow-lg hover:shadow-xl min-h-[48px] min-w-[48px] focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#2B2B2B]"
        style={{
          animationDelay: '0.2s',
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default OrderSuccess;
