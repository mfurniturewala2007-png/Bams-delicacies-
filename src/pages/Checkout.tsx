import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';
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
              className="w-full bg-transparent outline-none text-text text-sm font-medium border-b pb-0.5 border-primary focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E]"
              style={{ fontSize: '16px' }}
            />
          ) : (
            <p className={`text-sm font-medium truncate ${value ? 'text-text' : 'text-muted'}`}>
              {value || `Enter ${label.toLowerCase()}`}
            </p>
          )}
          <div className="min-h-[18px]">
            {error && (
              <p className="text-[11px] mt-1 font-semibold text-red-400">{error}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center ${editing ? 'text-primary' : 'text-muted'} focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E]`}
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
  const { items, totalAmount, clearCart } = useCart();
  const { profile, isLoadingProfile } = useAuth();

  // ── Guards ────────────────────────────────────────────────────────────────
  // NOTE: We wait for isLoadingProfile to be false before redirecting.
  // Without this, the async session restore causes a false "!profile" on first
  // render which incorrectly redirects logged-in users, causing the white screen.
  useEffect(() => {
    if (isLoadingProfile) return; // still fetching — do nothing yet
    if (items.length === 0 || !profile) {
      navigate('/', { replace: true });
    }
  }, [items.length, profile, isLoadingProfile, navigate]);

  // ── Delivery dates ────────────────────────────────────────────────────────
  const { saturday, sunday } = getAvailableDeliveryDates();
  const satStr = format(saturday, 'yyyy-MM-dd');
  const sunStr = format(sunday, 'yyyy-MM-dd');

  const [slotOrders, setSlotOrders] = useState<{ delivery_date: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [settings, setSettings] = useState({
    satCapacity: 15,
    sunCapacity: 15,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('*')
          .in('key', [
            'max_orders_saturday',
            'max_orders_sunday',
            'max_orders_per_day',
          ]);
        if (data) {
          const general = data.find(r => r.key === 'max_orders_per_day')?.value || '15';
          const sat = data.find(r => r.key === 'max_orders_saturday')?.value || general;
          const sun = data.find(r => r.key === 'max_orders_sunday')?.value || general;
          
          const satVal = parseInt(sat, 10);
          const sunVal = parseInt(sun, 10);

          setSettings({
            satCapacity: isNaN(satVal) ? 15 : satVal,
            sunCapacity: isNaN(sunVal) ? 15 : sunVal,
          });
        }
      } catch (err) {
        console.warn('Failed to load settings in checkout:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      const dates = [satStr, sunStr];
      const { data } = await supabase
        .from('orders')
        .select('delivery_date')
        .in('delivery_date', dates)
        .neq('status', 'cancelled');
      if (data) setSlotOrders(data);
    };
    fetchSlots();
  }, [satStr, sunStr]);

  const satCount = getSlotCount(slotOrders, satStr);
  const sunCount = getSlotCount(slotOrders, sunStr);

  const satFull = satCount >= settings.satCapacity;
  const sunFull = sunCount >= settings.sunCapacity;

  const dateOptions = useMemo(() => [
    { date: saturday, label: 'Saturday Delivery', dateStr: satStr, isFull: satFull, capacity: settings.satCapacity, count: satCount },
    { date: sunday, label: 'Sunday Delivery', dateStr: sunStr, isFull: sunFull, capacity: settings.sunCapacity, count: sunCount },
  ], [saturday, sunday, satStr, sunStr, satFull, sunFull, settings.satCapacity, settings.sunCapacity, satCount, sunCount]);

  // ── Accordion ─────────────────────────────────────────────────────────────
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ── Delivery details ──────────────────────────────────────────────────────
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [pincode, setPincode] = useState(profile?.pincode ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Payment ───────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD' | null>(null);

  // ── Order submit ──────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentTotal, setPaymentTotal] = useState(0);

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
        body: JSON.stringify({ order_id: data?.id, ...orderPayload }),
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

  if (items.length === 0 || !profile) return null;

  const itemCount = items.reduce((s, i) => s + i.dozens, 0);

  return (
    <>
      {/* ── Page shell ───────────────────────────────────────────────────── */}
      <div className="min-h-screen pb-32 bg-bg text-text">

        {/* ── [1] STICKY HEADER ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b bg-surface border-border/60 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 min-w-[48px] bg-surface-2 text-muted border border-border/40 hover:border-[#F5C200]/50 focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E]"
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
          <span className="text-sm font-bold px-3 py-1.5 rounded-full flex-shrink-0 bg-[#F5C200] text-[#1E1E1E] shadow-md">
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
                className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[56px] focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E]"
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
                  {items.map((item) => (
                    <div
                      key={item.product_id}
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
                        <p className="text-xs mt-0.5 text-muted">
                          {item.dozens} doz × {item.dozens * 12} pcs
                        </p>
                      </div>
                      <span className="text-sm font-black flex-shrink-0 text-yellow">
                        ₹{item.price_per_dozen * item.dozens}
                      </span>
                    </div>
                  ))}

                  {/* Summary total row */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Total</span>
                    <span className="text-lg font-black text-yellow">₹{totalAmount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── [3] DELIVERY DATE ─────────────────────────────────────── */}
            <div className="rounded-2xl border px-4 py-4 bg-surface border-border/40 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 text-muted">
                Delivery Date <span style={{ color: '#ef4444' }}>*</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dateOptions.map((opt) => {
                  const { date, label, dateStr, isFull, capacity, count } = opt;
                  const isSelected = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === dateStr : false;
                  const slotsLeft = Math.max(0, capacity - count);
                  const isLow = !isFull && slotsLeft <= 5;
                  const isDisabledOption = isFull;

                  return (
                    <button
                      key={dateStr}
                      disabled={isDisabledOption}
                      onClick={() => !isDisabledOption && setSelectedDate(date)}
                      className={`relative rounded-xl py-3 px-4 text-left transition-all duration-200 border min-h-[85px] focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] ${
                        isSelected
                          ? 'bg-primary/10 border-[#F5C200] shadow-md text-text'
                          : 'bg-surface-2 border-border/40 text-text/85 hover:border-[#F5C200]/50'
                      }`}
                      style={{
                        opacity: isDisabledOption ? 0.4 : 1,
                        cursor: isDisabledOption ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-[#F5C200] text-[#1E1E1E]">
                          ✓
                        </span>
                      )}
                      <p className={`text-sm font-black pr-5 ${isDisabledOption ? 'text-muted/40' : 'text-text'}`}>{label}</p>
                      <p className="text-xs mt-0.5 text-muted">{format(date, 'd MMM')}</p>

                      {isFull ? (
                        <span className="mt-2 inline-block text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-error/15 text-red-400 border border-error/35">
                          Sold Out
                        </span>
                      ) : isLow ? (
                        <span className="mt-2 block text-[10px] font-bold text-primary">
                          ⚠️ {slotsLeft} left!
                        </span>
                      ) : (
                        <span className="mt-2 block text-[10px] font-semibold text-muted">
                          {slotsLeft} slots left
                        </span>
                      )}
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
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] ${
                  paymentMethod === 'UPI'
                    ? 'bg-primary/10 border-[#F5C200] shadow-md text-text'
                    : 'bg-surface-2 border-border/40 text-text/85 hover:border-[#F5C200]/50'
                }`}
              >
                <span className="text-2xl">📲</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text">Pay Online (UPI)</p>
                  <p className="text-xs mt-0.5 text-muted">Scan QR · GPay / PhonePe / Paytm</p>
                </div>
                {paymentMethod === 'UPI' && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 bg-[#F5C200] text-[#1E1E1E]">
                    ✓
                  </span>
                )}
              </button>

              {/* COD card */}
              <button
                onClick={() => setPaymentMethod('COD')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] ${
                  paymentMethod === 'COD'
                    ? 'bg-primary/10 border-[#F5C200] shadow-md text-text'
                    : 'bg-surface-2 border-border/40 text-text/85 hover:border-[#F5C200]/50'
                }`}
              >
                <span className="text-2xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text">Cash on Delivery</p>
                  <p className="text-xs mt-0.5 text-muted">Pay ₹{totalAmount} on arrival</p>
                </div>
                {paymentMethod === 'COD' && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 bg-[#F5C200] text-[#1E1E1E]">
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
        <button
          onClick={handlePlaceOrder}
          disabled={isDisabled}
          className={`w-full px-6 py-3 rounded-lg font-bold text-lg tracking-wide transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] ${
            isDisabled
              ? 'bg-surface-2 text-muted/60 border border-border/40 cursor-not-allowed shadow-none'
              : 'bg-[#F5C200] text-[#1E1E1E] hover:bg-[#C49A00] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F5C200] focus:ring-offset-2 focus:ring-offset-[#1E1E1E]'
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
        />
      )}
    </>
  );
};

export default Checkout;
