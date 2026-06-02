import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PheliRaat from './pages/PheliRaat';

// ─── Page Fade Wrapper ─────────────────────────────────────────────────────
// Applies the animate-page-fade CSS keyframe on every route mount.
// This gives each page a subtle 200ms opacity fade-in — premium feel,
// no heavy animation libraries needed.
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);

  return (
    <div key={pathname} className="animate-page-fade">
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRE-DEPLOY CHECKLIST (all required before going live on Vercel)
// ─────────────────────────────────────────────────────────────────────────────
//
// Supabase Setup:
//   [ ] Create `products` table with columns:
//         id (uuid, PK), name, description, price, image_url,
//         category, in_stock (bool), created_at (timestamptz default now())
//   [ ] Create `orders` table with columns:
//         id (uuid, PK), customer_name, customer_phone, customer_address,
//         delivery_date (date), items (jsonb), total (numeric),
//         status (text, default 'pending'), created_at (timestamptz default now())
//   [ ] Create `push_subscriptions` table:
//         id (uuid, PK), subscription (jsonb), created_at (timestamptz default now())
//   [ ] Create `product-images` storage bucket (public read, authenticated write)
//   [ ] Enable Row Level Security on all tables with appropriate policies
//
// VAPID Key Generation (required for push notifications):
//   $ npx web-push generate-vapid-keys
//   Copy VAPID_PUBLIC_KEY  → Vercel env var VITE_VAPID_PUBLIC_KEY
//   Copy VAPID_PRIVATE_KEY → Vercel env var VAPID_PRIVATE_KEY
//   Set VAPID_EMAIL        → Vercel env var (e.g. mailto:admin@bamsdelicacies.com)
//
// Vercel Environment Variables (set in Vercel dashboard → Settings → Environment Variables):
//   VITE_SUPABASE_URL       = your Supabase project URL
//   VITE_SUPABASE_ANON_KEY  = your Supabase anon public key
//   VITE_VAPID_PUBLIC_KEY   = generated VAPID public key (starts with B...)
//   VITE_ADMIN_PASSWORD     = secure admin password (min 12 chars)
//   VITE_EMAILJS_SERVICE_ID = EmailJS service ID (optional, for email receipts)
//   VITE_EMAILJS_TEMPLATE_ID= EmailJS template ID (optional)
//   VITE_EMAILJS_PUBLIC_KEY = EmailJS public key (optional)
//   VAPID_PRIVATE_KEY       = generated VAPID private key (server-side only, no VITE_ prefix)
//   VAPID_EMAIL             = mailto: address for VAPID contact
//
// Vercel Deployment:
//   [ ] Push repo to GitHub
//   [ ] Import project in Vercel dashboard
//   [ ] Framework preset: Vite
//   [ ] Output directory: dist
//   [ ] Set all env vars above
//   [ ] Deploy!
//
// Post-Deploy Verification:
//   [ ] Logo image loads correctly at /logo.jpeg
//   [ ] Products fetch from Supabase (check browser network tab)
//   [ ] Cart add/remove works in-session (no localStorage used)
//   [ ] Order form submits successfully to Supabase
//   [ ] Delivery date calculation shows next available Saturday/Sunday
//   [ ] Admin login works with VITE_ADMIN_PASSWORD
//   [ ] Admin can toggle product stock status
//   [ ] Admin can add a new product with image
//   [ ] Push notification opt-in prompts user permission
//   [ ] Service worker registered at /service-worker.js
//   [ ] /admin route renders (not a 404) — vercel.json rewrite handles SPA routing
// ─────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AuthModal />
          {/* PageWrapper re-mounts on route change → triggers fade-in animation */}
          <PageWrapper>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/pheli-raat" element={<PheliRaat />} />
            </Routes>
          </PageWrapper>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
