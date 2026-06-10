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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#2B2B2B' }}
    >
      {/* Animated check circle */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-fade-slide-up"
        style={{ backgroundColor: 'rgba(245,194,0,0.12)', border: '2px solid #F5C200' }}
      >
        <span className="text-5xl">🎉</span>
      </div>

      <h1
        className="text-3xl font-black mb-3 animate-fade-slide-up"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: '#F5C200',
          animationDelay: '0.05s',
        }}
      >
        Order Placed!
      </h1>

      <p
        className="text-base max-w-xs leading-relaxed mb-2 animate-fade-slide-up"
        style={{ color: '#fff', animationDelay: '0.1s', fontFamily: "'DM Sans', sans-serif" }}
      >
        Your order has been received. We'll confirm delivery details via WhatsApp or phone.
      </p>

      <p
        className="text-sm mb-10 animate-fade-slide-up"
        style={{ color: '#999', animationDelay: '0.15s', fontFamily: "'DM Sans', sans-serif" }}
      >
        Redirecting to home in a few seconds…
      </p>

      <button
        onClick={() => navigate('/')}
        className="px-8 py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 animate-fade-slide-up"
        style={{
          backgroundColor: '#F5C200',
          color: '#1E1E1E',
          fontFamily: "'DM Sans', sans-serif",
          animationDelay: '0.2s',
          boxShadow: '0 0 24px rgba(245,194,0,0.25)',
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default OrderSuccess;
