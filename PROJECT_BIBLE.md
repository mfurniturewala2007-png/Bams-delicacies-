# PROJECT BIBLE — Bam's Delicacies
> Read this file before executing any prompt. This is the single source of truth.

---

## 1. PROJECT IDENTITY

| Key | Value |
|-----|-------|
| App name | Bam's Delicacies |
| Type | Homemade food ordering website |
| Owner | Mom (admin) + Mohammed (developer) |
| Deploy target | Vercel |
| Repo style | Monorepo (React frontend + /api serverless functions) |

**Tagline:** "Homemade. Delivered with love."

---

## 2. TECH STACK

| Layer | Tool |
|-------|------|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS (no external UI libraries) |
| Backend/DB | Supabase |
| Deployment | Vercel |
| Email | EmailJS |
| Push Notifications | Web Push (VAPID) |
| Date logic | date-fns |
| Image storage | Supabase Storage |

---

## 3. CRITICAL RULES — NEVER BREAK THESE

1. All `/api` files → ES module syntax only (`import`/`export`). NEVER `require()`.
2. Service worker file → NEVER use `import`/`export`. Vanilla JS only.
3. Vercel server-side env vars → NO `VITE_` prefix (e.g. `VAPID_PRIVATE_KEY` not `VITE_VAPID_PRIVATE_KEY`).
4. Client-side env vars → MUST use `VITE_` prefix (e.g. `VITE_SUPABASE_URL`).
5. `/api` folder name → always lowercase.
6. Brand name → always "Bam's Delicacies". Never abbreviate.
7. Never use `localStorage` or `sessionStorage`. Use React state.
8. No external UI component libraries (no shadcn, no MUI, no Chakra). Pure Tailwind only.

---

## 4. DESIGN SYSTEM

### 4.1 Color Palette

```css
--color-bg:         #2B2B2B;   /* Main background — dark charcoal (matches logo) */
--color-surface:    #1E1E1E;   /* Cards, modals, panels */
--color-surface-2:  #333333;   /* Elevated surfaces, inputs */
--color-border:     #3D3D3D;   /* Borders, dividers */
--color-yellow:     #F5C200;   /* Primary brand yellow (exact logo match) */
--color-yellow-dim: #C49A00;   /* Hover state for yellow */
--color-yellow-glow:#F5C20033; /* Yellow glow (20% opacity) */
--color-white:      #F5F5F5;   /* Primary text */
--color-muted:      #999999;   /* Secondary text, placeholders */
--color-success:    #4CAF50;   /* Order confirmed */
--color-error:      #EF4444;   /* Errors, full slots */
--color-warning:    #FB923C;   /* Low slots warning */
```

### 4.2 Typography

```css
/* Display / Headings */
font-family: 'Playfair Display', serif;   /* Elegant, premium feel */

/* Body / UI */
font-family: 'DM Sans', sans-serif;       /* Clean, modern, readable */
```

Import from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

### 4.3 Spacing Scale
Use Tailwind defaults. Prefer: `p-4`, `p-6`, `p-8`, `gap-4`, `gap-6`.

### 4.4 Border Radius
- Cards: `rounded-2xl`
- Buttons: `rounded-full`
- Inputs: `rounded-xl`
- Badges: `rounded-full`

### 4.5 Shadows
```css
--shadow-card: 0 4px 24px rgba(0,0,0,0.4);
--shadow-yellow: 0 0 20px rgba(245, 194, 0, 0.15);
--shadow-yellow-strong: 0 0 32px rgba(245, 194, 0, 0.35);
```

### 4.6 Component Specs

**Primary Button (CTA)**
```
bg: #F5C200 | text: #1E1E1E | font-weight: 600
padding: px-6 py-3 | radius: rounded-full
hover: bg #C49A00 + scale-105 + shadow-yellow-strong
transition: all 200ms ease
```

**Card**
```
bg: #1E1E1E | border: 1px solid #3D3D3D
radius: rounded-2xl | shadow: shadow-card
hover: border-color #F5C200 + shadow-yellow
transition: all 300ms ease
```

**Input**
```
bg: #333333 | border: 1px solid #3D3D3D
text: #F5F5F5 | placeholder: #999999
radius: rounded-xl | padding: px-4 py-3
focus: border #F5C200 + box-shadow 0 0 0 2px #F5C20033
```

**Yellow Badge / Pill**
```
bg: #F5C200 | text: #1E1E1E | font-weight: 600
padding: px-3 py-1 | radius: rounded-full | text-sm
```

---

## 5. ANIMATIONS

All animations use CSS keyframes or Tailwind transitions. No GSAP.

```css
/* Float — hero elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

/* Pulse glow — low slot warning */
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(245,194,0,0.3); }
  50% { box-shadow: 0 0 20px rgba(245,194,0,0.7); }
}

/* Stagger fade-in — menu cards */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide in from right — cart sidebar */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

Stagger: apply `animation-delay: calc(index * 100ms)` to each menu card.

---

## 6. PAGE STRUCTURE

```
/                   → Customer-facing site
  [Navbar]          → Logo left | Nav links center | Cart icon right (with badge)
  [Hero]            → Full-height, floating elements, delivery badge, CTA
  [HowItWorks]      → 3-step animated explainer
  [Menu]            → Product grid (id="menu")
  [OrderForm]       → Delivery date picker + customer form
  [Footer]          → Contact info, Instagram

/admin              → Password-protected admin panel
  [Products tab]    → Add / edit / delete products
  [Orders tab]      → View orders by delivery date, update status
```

---

## 7. SUPABASE SCHEMA

### Table: `products`
```sql
id           uuid primary key default gen_random_uuid()
name         text not null
description  text
price        numeric(10,2) not null
image_url    text
category     text
in_stock     boolean default true
created_at   timestamptz default now()
```

### Table: `orders`
```sql
id               uuid primary key default gen_random_uuid()
customer_name    text not null
customer_phone   text not null
customer_address text not null
delivery_date    date not null
items            jsonb not null
total            numeric(10,2) not null
status           text default 'pending'
created_at       timestamptz default now()
```

### Table: `push_subscriptions`
```sql
id            uuid primary key default gen_random_uuid()
subscription  jsonb not null
created_at    timestamptz default now()
```

### RLS Policies
- `products`: SELECT → public. All others → authenticated only.
- `orders`: INSERT → public. SELECT/UPDATE → authenticated only.
- `push_subscriptions`: INSERT → public. SELECT → authenticated only.

### Storage
- Bucket name: `product-images`
- Public bucket: yes
- Allowed types: image/jpeg, image/png, image/webp

---

## 8. DELIVERY DATE LOGIC

```typescript
// File: src/utils/deliveryDates.ts
import { addDays, nextSaturday, nextSunday, getDay } from 'date-fns';

export const MAX_ORDERS_PER_DAY = 15;

export function getAvailableDeliveryDates(): { saturday: Date; sunday: Date } {
  const today = new Date();
  const dayOfWeek = getDay(today); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  // Fri (5), Sat (6), Sun (0) → use NEXT week's Sat/Sun
  // Mon (1) through Thu (4) → use THIS week's Sat/Sun
  const useNextWeek = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  let saturday = nextSaturday(today);
  let sunday = nextSunday(today);

  if (useNextWeek) {
    saturday = addDays(saturday, 7);
    sunday = addDays(sunday, 7);
  }

  return { saturday, sunday };
}

export function getSlotsLeft(date: Date, orders: { delivery_date: string }[]): number {
  const dateStr = date.toISOString().split('T')[0];
  const count = orders.filter(o => o.delivery_date === dateStr).length;
  return Math.max(0, MAX_ORDERS_PER_DAY - count);
}
```

---

## 9. ENV VARIABLES

### `.env` (client-side — VITE_ prefix required)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
VITE_ADMIN_PASSWORD=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

### Vercel env (server-side — NO VITE_ prefix)
```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

---

## 10. LOGO USAGE

- Logo file: `BAMS_LOGO.jpeg` (yellow cooking pot on dark charcoal bg)
- Place at: `public/logo.jpeg`
- Navbar: show as `<img>` 40px height
- Favicon: use logo
- DO NOT recreate logo as text/SVG. Always use the image file.
- On dark backgrounds: logo renders naturally (charcoal bg matches site bg)

---

## 11. ADMIN PANEL

- Route: `/admin`
- Auth: check `localStorage`... wait — NO localStorage. Use React state + sessionStorage workaround only for admin session (admin doesn't need persistence across sessions).
- Password: compare against `import.meta.env.VITE_ADMIN_PASSWORD`
- Two tabs: **Products** | **Orders**

### Products Tab
- List all products (fetch from Supabase)
- Toggle `in_stock` inline
- Delete with confirm dialog
- "Add Product" → modal with: name, description, price, category, image upload, in_stock toggle
- Image upload: upload to Supabase Storage `product-images` bucket → get public URL → save to `products.image_url`

### Orders Tab
- Filter dropdown: this Saturday / this Sunday / next Saturday / next Sunday
- Orders table: customer_name, customer_phone, customer_address, items (formatted), total, status
- Status update dropdown per order: pending → confirmed → delivered
- Slot counter: "X / 15 orders" shown per selected day

---

## 12. NOTIFICATIONS

### Web Push Flow
1. Customer visits site → "🔔 Get delivery updates" button shown
2. Click → browser asks permission
3. Permission granted → subscribe with VAPID public key → save subscription to `push_subscriptions` table
4. Admin panel → "Notify All Customers" button → input custom message → calls `/api/send-notification`
5. `/api/send-notification.js` → fetch all subscriptions → send push to each

### Service Worker (`public/service-worker.js`)
- No import/export — vanilla JS only
- Listen for `push` event → `self.registration.showNotification('Bam\'s Delicacies', { body, icon: '/logo.jpeg' })`
- Listen for `notificationclick` → open site

### `/api/send-notification.js`
- ES module syntax (`import`/`export default`)
- Use `web-push` npm package
- Read `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` from `process.env` (no VITE_ prefix)

---

## 13. FOLDER STRUCTURE

```
bams-delicacies/
├── api/
│   └── send-notification.js       ← Vercel serverless function
├── public/
│   ├── logo.jpeg
│   └── service-worker.js
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── MenuGrid.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartSidebar.tsx
│   │   ├── OrderForm.tsx
│   │   ├── DeliveryPicker.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Admin.tsx
│   ├── utils/
│   │   ├── deliveryDates.ts
│   │   └── supabase.ts
│   ├── context/
│   │   └── CartContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vercel.json
├── .env.example
└── PROJECT_BIBLE.md               ← this file
```

---

## 14. VERCEL CONFIG

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ]
}
```

---

## 15. MOBILE RESPONSIVENESS

- All layouts: mobile-first
- Navbar: hamburger menu on mobile (< 768px)
- Menu grid: 1 col mobile → 2 col tablet → 3 col desktop
- Cart sidebar: full-width on mobile, 400px on desktop
- Order form: full-width, stacked fields
- Tap targets: minimum 44px height

---

*End of PROJECT_BIBLE.md — Antigravity must read this before every prompt.*
