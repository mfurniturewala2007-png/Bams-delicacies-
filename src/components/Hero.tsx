import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../utils/supabase';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';

// ─── Push Subscription Helpers ───────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

const Hero: React.FC = () => {
  const [slotsLeft, setSlotsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Push notification subscription state
  const [pushState, setPushState] = useState<'idle' | 'requesting' | 'subscribed' | 'error'>('idle');
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const { saturday: nextSaturday } = getAvailableDeliveryDates();
  const formattedDeliveryDate = format(nextSaturday, 'EEE, MMM d'); // e.g. "Sat, Jun 7"
  const dbDateStr = format(nextSaturday, 'yyyy-MM-dd'); // target query key e.g. "2026-06-07"

  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        setLoading(true);
        // Using an efficient head-only count query
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('delivery_date', dbDateStr);

        if (error) {
          throw error;
        }

        // Fetch dynamic capacity settings for Saturday
        let limit = 15;
        try {
          const { data: settingsData } = await supabase
            .from('settings')
            .select('*')
            .in('key', ['max_orders_per_day', 'max_orders_saturday']);
          if (settingsData) {
            const general = settingsData.find(r => r.key === 'max_orders_per_day')?.value || '15';
            const sat = settingsData.find(r => r.key === 'max_orders_saturday')?.value || general;
            limit = Number(sat);
          }
        } catch (se) {
          console.warn('Failed to load settings limit, falling back to 15', se);
        }

        const ordersCount = count || 0;
        const slotsRemaining = Math.max(0, limit - ordersCount);
        setSlotsLeft(slotsRemaining);
      } catch (err) {
        console.error('Error fetching order count from Supabase:', err);
        // Robust fallback to full slots if Supabase vars are missing or request fails
        setSlotsLeft(15);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCount();
  }, [dbDateStr]);

  // Determine low slots styling (if slots <= 5, trigger glow warning animation)
  const isLowSlots = slotsLeft !== null && slotsLeft <= 5;

  // ─── Push Notification Subscription Handler ─────────────────────────────
  const handlePushSubscribe = async () => {
    try {
      setPushState('requesting');

      // 1. Check browser support
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setPushState('error');
        setPushMsg('Notifications not supported in this browser.');
        return;
      }

      // 2. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState('error');
        setPushMsg('Notification permission denied.');
        return;
      }

      // 3. Register service worker if not already
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // 4. Subscribe to push
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setPushState('error');
        setPushMsg('Push notifications not configured yet.');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 5. Save subscription to Supabase
      await supabase.from('push_subscriptions').insert([
        { subscription: sub.toJSON() },
      ]);

      setPushState('subscribed');
    } catch (err) {
      console.error('Push subscription error:', err);
      setPushState('error');
      setPushMsg('Could not enable notifications. Try again later.');
    }
  };

  return (
    <section className="min-h-[100dvh] flex flex-col justify-center items-center px-4 relative overflow-hidden bg-bg">
      {/* Premium Ambient Orange Glow Background (Radial Gradient) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(200,81,27,0.05) 0%, rgba(255,248,238,0) 75%)'
        }}
      />

      {/* Floating Emojis in Background */}
      <div className="absolute inset-0 pointer-events-none z-0 select-none">
        {/* Emoji 1: Left Top */}
        <div 
          className="absolute text-5xl md:text-7xl left-[8%] top-[25%] opacity-30 md:opacity-40 animate-float"
          style={{ animationDuration: '6s', animationDelay: '0s' }}
        >
          🍛
        </div>
        {/* Emoji 2: Right Top */}
        <div 
          className="absolute text-6xl md:text-8xl right-[10%] top-[20%] opacity-30 md:opacity-40 animate-float"
          style={{ animationDuration: '7s', animationDelay: '1.5s' }}
        >
          🍲
        </div>
        {/* Emoji 3: Bottom Left */}
        <div 
          className="absolute text-4xl md:text-6xl left-[12%] bottom-[18%] opacity-20 md:opacity-30 animate-float"
          style={{ animationDuration: '8s', animationDelay: '3s' }}
        >
          🥘
        </div>
        {/* Extra decorative emoji for desktop balance */}
        <div 
          className="absolute hidden md:block text-5xl right-[15%] bottom-[25%] opacity-25 animate-float"
          style={{ animationDuration: '9s', animationDelay: '4.5s' }}
        >
          🍱
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col items-center max-w-4xl text-center z-10 animate-fade-slide-up select-text">
        {/* Top Center Floating Brand Logo */}
        <div className="mb-5 relative group animate-float" style={{ animationDuration: '4s' }}>
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/35 transition-all duration-500 animate-pulse" />
          <img
            src="/logo.jpeg"
            alt="Bam's Delicacies"
            className="w-20 md:w-28 rounded-full border-4 border-primary/20 relative z-10 transition-all duration-500 group-hover:scale-105 group-hover:border-primary shadow-lg"
          />
        </div>

        {/* Dynamic Delivery Date & Slots Badge */}
        <div
          className={`mb-5 inline-flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-surface-2 border border-border text-xs md:text-sm font-semibold tracking-wide uppercase transition-all duration-300 ${
            isLowSlots
              ? 'border-error/50 text-error animate-pulse-glow shadow-primary-strong bg-surface'
              : 'text-yellow shadow-yellow'
          }`}
        >
          <span>🗓</span>
          <span className="whitespace-nowrap">
            Next: <strong>{formattedDeliveryDate}</strong>
          </span>
          <span className="text-text/30">•</span>
          {loading ? (
            <span className="inline-block w-12 h-3.5 bg-text/10 animate-pulse rounded"></span>
          ) : (
            <span className={`whitespace-nowrap ${isLowSlots ? 'font-bold text-error' : 'text-text'}`}>
              {slotsLeft} slots left
            </span>
          )}
        </div>

        {/* Primary Hero Heading */}
        <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-8xl bg-gradient-to-r from-[#8B3A00] via-[#C8511B] to-[#F5C200] bg-clip-text text-transparent leading-tight tracking-tight drop-shadow-md pb-2 select-none">
          Bam's Delicacies
        </h1>

        {/* Catchy Subheading */}
        <p className="font-sans font-medium text-text/90 text-base md:text-2xl mt-3 max-w-2xl leading-relaxed">
          Homemade. Delivered with love.
        </p>

        {/* Subtext explaining booking cutoff */}
        <p className="text-muted text-sm mt-2 max-w-sm px-2 leading-relaxed">
          Pre-orders open weekly. Cut-off every Thursday night for weekend delivery.
        </p>

        {/* CTA Action Button */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href="#menu"
            className="group inline-flex items-center gap-3 bg-primary text-white font-sans font-bold text-sm md:text-base px-8 md:px-10 py-4 rounded-full shadow-primary hover:bg-primary-hover hover:scale-[1.04] hover:shadow-primary-strong active:scale-95 transition-all duration-300 ease-out cursor-pointer"
          >
            <span>Order Now</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-4 h-4 md:w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>

          {/* Push Notification Opt-in Button */}
          {pushState !== 'subscribed' && (
            <button
              onClick={handlePushSubscribe}
              disabled={pushState === 'requesting'}
              className="inline-flex items-center justify-center gap-2 text-xs font-sans font-semibold text-muted md:hover:text-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] py-1.5 px-4 rounded-full bg-surface-2/60 border border-border/40 active:scale-95 transition-all"
            >
              {pushState === 'requesting' ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span>Enabling notifications...</span>
                </>
              ) : (
                <>
                  <span>🔔</span>
                  <span>Get delivery updates</span>
                </>
              )}
            </button>
          )}
          {pushState === 'subscribed' && (
            <span className="text-xs font-sans text-success flex items-center gap-1.5">
              ✓ You'll receive delivery updates!
            </span>
          )}
          {pushState === 'error' && pushMsg && (
            <span className="text-xs font-sans text-muted">{pushMsg}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
