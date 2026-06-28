import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { getNext7DeliveryDays } from '../utils/deliveryDates';
import { FRYING_CHARGE_PER_DOZEN } from '../types';
import PaymentModal from '../components/PaymentModal';
import { useScrollLock } from '../hooks/useScrollLock';

// ─── Colour tokens ────────────────────────────────────────────────────────────
// bg:#2B2B2B  card:#1E1E1E  border:#3D3D3D  accent:#F5C200  muted:#999

function getSlotCount(orders: { delivery_date: string }[], dateStr: string): number {
  return orders.filter((o) => o.delivery_date === dateStr).length;
}

// ─── Pencil icon ──────────────────────────────────────────────────────────────
const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// ─── Chevron icon ─────────────────────────────────────────────────────────────
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Editable field ───────────────────────────────────────────────────────────
interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  error?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label, value, onChange, type = 'text', maxLength, inputMode, error,
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only auto-focus on desktop; mobile focus is handled by tap
    if (editing && window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, [editing]);

  return (
    <div className="py-3 border-b last:border-b-0 border-border/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5 text-muted">
            {label}
          </p>
          {editing ? (
            <input
              ref={inputRef}
              type={type}
              inputMode={inputMode}
              maxLength={maxLength}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => setEditing(false)}
              className="w-full bg-transparent outline-none text-text text-sm font-medium border-b pb-0.5 border-primary focus:border-primary-hover"
              style={{ fontSize: '16px' }}
            />
          ) : (
            <p className={`text-sm font-medium truncate ${value ? 'text-text' : 'text-muted/60'}`}>
              {value || `Enter ${label.toLowerCase()}`}
            </p>
          )}
          <div className="min-h-[18px]">
            {error && (
              <p className="text-[11px] mt-1 font-semibold text-error">{error}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${editing ? 'text-primary' : 'text-muted'}`}
          aria-label={`Edit ${label}`}
        >
          <PencilIcon />
        </button>
      </div>
    </div>
  );
};

// ─── Main Checkout Page ───────────────────────────────────────────────────────
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart, updateQty } = useCart();
  const { profile, isLoadingProfile } = useAuth();

  // ── Guards ─────────────────────────────────────────────────────────────────
  // NOTE: We wait for isLoadingProfile to be false before redirecting.
  // Without this, the async session restore causes a false "!profile" on first
  // render which incorrectly redirects logged-in users, causing the white screen.
  useEffect((): (() => void) | void => {
    if (isLoadingProfile) return; // still fetching — do nothing yet
    if (items.length === 0) {
      navigate('/', { replace: true });
      return;
    }
    if (!profile) {
      // Show a brief message before redirecting so user knows why
      const timer = setTimeout(() => navigate('/', { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
  }, [items.length, profile, isLoadingProfile, navigate]);

  // ── Delivery dates ────────────────────────────────────────────────────────
  const deliveryDays = useMemo(() => getNext7DeliveryDays(), []);
  const allDateStrs = useMemo(() => deliveryDays.map(d => format(d.date, 'yyyy-MM-dd')), [deliveryDays]);

  const [slotOrders, setSlotOrders] = useState<{ delivery_date: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [defaultCapacity, setDefaultCapacity] = useState(15);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('*')
          .in('key', ['max_orders_per_day']);
        if (data) {
          const general = data.find(r => r.key === 'max_orders_per_day')?.value || '15';
          const val = parseInt(general, 10);
          setDefaultCapacity(isNaN(val) ? 15 : val);
        }
      } catch (err) {
        console.warn('Failed to load settings in checkout:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await supabase
        .from('orders')
        .select('delivery_date')
        .in('delivery_date', allDateStrs)
        .neq('status', 'cancelled');
      if (data) setSlotOrders(data);
    };
    fetchSlots();
  }, [allDateStrs]);

  // ── Accordion ─────────────────────────────────────────────────────────────
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ── Delivery details ──────────────────────────────────────────────────────
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [pincode, setPincode] = useState(profile?.pincode ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD' | null>('COD');

  // ── Order submit ──────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useScrollLock(!!paymentOrderId);

  // ── CTA disabled logic ────────────────────────────────────────────────────
  const isDisabled =
    !selectedDate ||
    !paymentMethod ||
    !name.trim() ||
    !phone.trim() ||
    !address.trim() ||
    !pincode.trim() ||
    isSubmitting;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Required';
    if (!/^[0-9]{10}$/.test(phone.trim())) errs.phone = 'Enter valid 10-digit number';
    if (!address.trim()) errs.address = 'Required';
    if (!/^[0-9]{4,6}$/.test(pincode.trim())) errs.pincode = 'Enter valid pincode';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate() || !selectedDate || !paymentMethod) return;
    setIsSubmitting(true);

    try {
      const deliveryDateStr = format(selectedDate, 'yyyy-MM-dd');
      const orderPayload = {
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: `${address.trim()}, ${pincode.trim()}`,
        delivery_date: deliveryDateStr,
        items,
        total: totalAmount,
        status: paymentMethod === 'COD' ? 'pending' : 'payment_pending',
        upi_transaction_id: null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select('id')
        .single();

      if (error) throw error;

      // Fire-and-forget Telegram notification
      fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: data?.id,
          ...orderPayload,
          payment_method: paymentMethod,
        }),
      }).catch(() => {});

      if (paymentMethod === 'COD') {
        clearCart();
        navigate('/order-success');
      } else {
        setPaymentTotal(totalAmount);
        setPaymentOrderId(data.id);
      }
    } catch (err: any) {
      console.error('Order failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfirmed = () => {
    setPaymentOrderId(null);
    clearCart();
    navigate('/order-success');
  };

  const handlePaymentCancelled = () => {
    setPaymentOrderId(null);
  };

  // "Change payment method" from PaymentModal — cancel the DB order, go back to COD
  const handleChangePay = async () => {
    if (paymentOrderId) {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', paymentOrderId);
    }
    setPaymentOrderId(null);
    setPaymentMethod('COD');
  };

  // Show a loading spinner while profile session is being restored
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-semibold text-muted">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  // Unauthenticated — show a friendly message for 2s before the redirect fires
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">🔒</span>
          <h2 className="font-serif font-black text-xl text-heading">Sign in to continue</h2>
          <p className="text-sm text-muted max-w-xs">
            You need to be signed in to access checkout. Redirecting you to the homepage…
          </p>
          <svg className="animate-spin h-6 w-6 text-primary mt-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  const itemCount = items.reduce((s, i) => s + i.dozens, 0);

  return (
    <>
      {/* ── Page shell ───────────────────────────────────────────────────── */}
      <div className="min-h-screen pb-32 bg-bg text-text">

        {/* ── [1] STICKY HEADER ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b bg-surface border-border/60 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 min-w-[44px] bg-surface-2 text-muted border border-border/40 hover:border-primary/50"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1 className="flex-1 text-xl font-black tracking-tight text-heading">
            Checkout
          </h1>

          {/* Total badge */}
          <span className="text-sm font-black px-3 py-1.5 rounded-full flex-shrink-0 bg-primary text-white shadow-primary">
            ₹{totalAmount}
          </span>
        </header>

        {/* ── Desktop 2-col / Mobile single-col ─────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 pt-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

          {/* LEFT COLUMN: Order summary + Delivery date */}
          <div className="space-y-4">

            {/* ── [2] ORDER SUMMARY accordion ─────────────────────────── */}
            <div className="rounded-2xl overflow-hidden border bg-surface border-border/40 text-text shadow-card">
              <button
                onClick={() => setSummaryOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[56px]"
                aria-expanded={summaryOpen}
              >
                <span className="text-sm font-bold text-text">
                  {summaryOpen
                    ? 'Order Summary'
                    : `${itemCount} dozen${itemCount !== 1 ? 's' : ''} · ₹${totalAmount}`}
                </span>
                <span className="text-muted">
                  <ChevronIcon open={summaryOpen} />
                </span>
              </button>

              {/* Expanded rows */}
              {summaryOpen && (
                <div className="border-t px-4 pb-2 border-border/40">
                  {items.map((item) => {
                    const effectivePrice = item.price_per_dozen + (item.fried ? FRYING_CHARGE_PER_DOZEN : 0);
                    const lineTotal = effectivePrice * item.dozens;
                    return (
                    <div
                      key={`${item.product_id}__${item.fried}`}
                      className="flex items-center gap-3 py-3 border-b last:border-b-0 border-border/40"
                    >
                      {/* 48px thumbnail */}
                      <img
                        src={item.image_url || '/logo.jpeg'}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-border/40"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-text">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.fried ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-accent/20 text-accent-dim border border-accent/30">
                              🍳 Fried
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-surface border border-border/60 text-muted">
                              🥙 Unfried
                            </span>
                          )}
                        </div>
                        {/* Quantity stepper */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQty(item.product_id, item.fried, item.dozens - 1)}
                            className="w-7 h-7 rounded-lg bg-surface-2 border border-border text-text hover:text-error hover:border-error/40 flex items-center justify-center font-bold text-sm transition-all duration-200"
                          >−</button>
                          <span className="text-xs font-bold text-text min-w-[40px] text-center">{item.dozens} doz</span>
                          <button
                            onClick={() => updateQty(item.product_id, item.fried, item.dozens + 1)}
                            className="w-7 h-7 rounded-lg bg-surface-2 border border-border text-text hover:text-primary hover:border-primary/40 flex items-center justify-center font-bold text-sm transition-all duration-200"
                          >+</button>
                        </div>
                      </div>
                      <span className="text-sm font-black flex-shrink-0 text-accent">
                        ₹{lineTotal}
                      </span>
                    </div>
                    );
                  })}

                  {/* Summary total row */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Total</span>
                    <span className="text-lg font-black text-accent">₹{totalAmount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── [3] DELIVERY DATE ─────────────────────────────────────── */}
            <div className="rounded-2xl border px-4 py-4 bg-surface border-border/40 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 text-muted">
                Delivery Date <span className="text-error">*</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {deliveryDays.map(({ date, isWeekend }) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === dateStr : false;
                  const count = getSlotCount(slotOrders, dateStr);
                  const slotsLeft = Math.max(0, defaultCapacity - count);
                  const isFull = slotsLeft === 0;
                  const isLow = !isFull && slotsLeft <= 5;

                  return (
                    <button
                      key={dateStr}
                      disabled={isFull}
                      onClick={() => !isFull && setSelectedDate(date)}
                      className={`relative rounded-xl py-3 px-3 text-left transition-all duration-200 border ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-primary text-text'
                          : isWeekend && !isFull
                          ? 'bg-accent/5 border-accent/40 text-text/90 hover:border-accent/70'
                          : 'bg-surface-2 border-border/40 text-text/85 hover:border-primary/50'
                      }`}
                      style={{
                        opacity: isFull ? 0.4 : 1,
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        boxShadow: isWeekend && !isFull && !isSelected
                          ? '0 0 10px var(--color-yellow-glow)'
                          : undefined,
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black bg-primary text-white">
                          ✓
                        </span>
                      )}

                      {/* Preferred badge for weekends */}
                      {isWeekend && !isFull && !isSelected && (
                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-accent/20 text-accent-dim border border-accent/30">
                          Preferred
                        </span>
                      )}

                      <p className={`text-[11px] font-black pr-1 ${isFull ? 'text-muted/40' : isWeekend ? 'text-accent-dim' : 'text-text'}`}>
                        {format(date, 'EEE')}
                      </p>
                      <p className="text-base font-black leading-tight mt-0.5 text-text">
                        {format(date, 'd')}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{format(date, 'MMM')}</p>

                      {isFull ? (
                        <span className="mt-2 inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-error/15 text-error border border-error/35">
                          Full
                        </span>
                      ) : isLow ? (
                        <span className="mt-1.5 block text-[9px] font-bold text-primary">
                          ⚠️ {slotsLeft} left
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>{/* end left column */}

          {/* RIGHT COLUMN: Delivery details + Payment */}
          <div className="space-y-4 mt-4 lg:mt-0">

            {/* ── [4] DELIVERY DETAILS ──────────────────────────────────── */}
            <div className="rounded-2xl border px-4 py-4 bg-surface border-border/40 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-muted">
                Delivery Details
              </p>

              <EditableField label="Name" value={name} onChange={setName} error={fieldErrors.name} />
              <EditableField
                label="Phone"
                value={phone}
                onChange={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                error={fieldErrors.phone}
              />
              <EditableField label="Address" value={address} onChange={setAddress} error={fieldErrors.address} />
              <EditableField
                label="Pincode"
                value={pincode}
                onChange={(v) => setPincode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                error={fieldErrors.pincode}
              />
            </div>

            {/* ── [5] PAYMENT METHOD ────────────────────────────────────── */}
            <div className="rounded-2xl border px-4 py-4 space-y-3 bg-surface border-border/40 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Payment Method
              </p>

              {/* UPI card */}
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 min-h-[64px] ${
                  paymentMethod === 'UPI'
                    ? 'bg-primary/10 border-primary shadow-primary text-text'
                    : 'bg-surface-2 border-border/40 text-text/85 hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">📲</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text">Pay Online (UPI)</p>
                  <p className="text-xs mt-0.5 text-muted">Scan QR · GPay / PhonePe / Paytm</p>
                </div>
                {paymentMethod === 'UPI' && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 bg-primary text-white">
                    ✓
                  </span>
                )}
              </button>

              {/* COD card */}
              <button
                onClick={() => setPaymentMethod('COD')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 min-h-[64px] ${
                  paymentMethod === 'COD'
                    ? 'bg-primary/10 border-primary shadow-primary text-text'
                    : 'bg-surface-2 border-border/40 text-text/85 hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text">Cash on Delivery</p>
                  <p className="text-xs mt-0.5 text-muted">Pay ₹{totalAmount} on arrival</p>
                </div>
                {paymentMethod === 'COD' && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 bg-primary text-white">
                    ✓
                  </span>
                )}
              </button>
            </div>

          </div>{/* end right column */}

          {/* Bottom spacer visible under sticky CTA */}
          <div className="h-4 lg:col-span-2" />

        </div>{/* end 2-col grid */}
      </div>

      {/* ── [6] STICKY BOTTOM CTA ─────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 bg-surface border-t border-border/60 shadow-md"
        style={{
          paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Error message if order submission failed */}
        {submitError && (
          <div className="mb-3 px-4 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-sans text-center">
            ⚠️ {submitError}
          </div>
        )}

        <button
          onClick={() => { setSubmitError(null); handlePlaceOrder(); }}
          disabled={isDisabled}
          className={`w-full py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 min-h-[52px] ${
            isDisabled
              ? 'bg-surface-2 text-muted border border-border/40 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover shadow-primary'
          }`}
          style={{
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Placing Order...</span>
            </>
          ) : (
            <span>Place Order →</span>
          )}
        </button>

        {/* Hint row when something is missing */}
        {!isSubmitting && isDisabled && (
          <p className="text-center text-[11px] mt-2 text-muted">
            {!selectedDate
              ? 'Select a delivery date to continue'
              : !paymentMethod
              ? 'Choose a payment method'
              : 'Fill in your delivery details'}
          </p>
        )}
      </div>

      {/* ── PaymentModal (UPI flow) ────────────────────────────────────────── */}
      {paymentOrderId && (
        <PaymentModal
          orderId={paymentOrderId}
          totalAmount={paymentTotal}
          onConfirmed={handlePaymentConfirmed}
          onCancel={handlePaymentCancelled}
          onChangePay={handleChangePay}
        />
      )}
    </>
  );
};

export default Checkout;
