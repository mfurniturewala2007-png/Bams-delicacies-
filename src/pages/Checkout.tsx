import React, { useState, useEffect, useRef } from 'react';
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

const MAX_SLOTS = 15;

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
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: '#3D3D3D' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#999' }}>
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
              className="w-full bg-transparent outline-none text-white text-sm font-medium border-b pb-0.5"
              style={{ borderColor: '#F5C200', color: '#fff', fontSize: '16px' }}
            />
          ) : (
            <p
              className="text-sm font-medium truncate"
              style={{ color: value ? '#fff' : '#999' }}
            >
              {value || `Enter ${label.toLowerCase()}`}
            </p>
          )}
          <div className="min-h-[18px]">
            {error && (
              <p className="text-[11px] mt-1 font-semibold" style={{ color: '#ef4444' }}>{error}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className="flex-shrink-0 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          style={{ color: editing ? '#F5C200' : '#999' }}
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
  const { profile } = useAuth();

  // ── Guards ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0 || !profile) {
      navigate('/', { replace: true });
    }
  }, [items.length, profile, navigate]);

  // ── Delivery dates ────────────────────────────────────────────────────────
  const { saturday, sunday } = getAvailableDeliveryDates();
  const satStr = format(saturday, 'yyyy-MM-dd');
  const sunStr = format(sunday, 'yyyy-MM-dd');

  const [slotOrders, setSlotOrders] = useState<{ delivery_date: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await supabase
        .from('orders')
        .select('delivery_date')
        .in('delivery_date', [satStr, sunStr])
        .neq('status', 'cancelled');
      if (data) setSlotOrders(data);
    };
    fetchSlots();
  }, [satStr, sunStr]);

  const satCount = getSlotCount(slotOrders, satStr);
  const sunCount = getSlotCount(slotOrders, sunStr);
  const satFull = satCount >= MAX_SLOTS;
  const sunFull = sunCount >= MAX_SLOTS;

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

  if (items.length === 0 || !profile) return null;

  const itemCount = items.reduce((s, i) => s + i.dozens, 0);

  return (
    <>
      {/* ── Page shell ───────────────────────────────────────────────────── */}
      <div className="min-h-screen pb-32" style={{ backgroundColor: '#2B2B2B', color: '#fff' }}>

        {/* ── [1] STICKY HEADER ─────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 border-b"
          style={{ backgroundColor: '#1E1E1E', borderColor: '#3D3D3D' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 min-w-[44px]"
            style={{ backgroundColor: '#2B2B2B', color: '#999' }}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1
            className="flex-1 text-xl font-black tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#fff' }}
          >
            Checkout
          </h1>

          {/* Total badge */}
          <span
            className="text-sm font-black px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#F5C200', color: '#1E1E1E' }}
          >
            ₹{totalAmount}
          </span>
        </header>

        {/* ── Desktop 2-col / Mobile single-col ─────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 pt-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

          {/* LEFT COLUMN: Order summary + Delivery date */}
          <div className="space-y-4">

            {/* ── [2] ORDER SUMMARY accordion ─────────────────────────── */}
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ backgroundColor: '#1E1E1E', borderColor: '#3D3D3D' }}
            >
              <button
                onClick={() => setSummaryOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[56px]"
                aria-expanded={summaryOpen}
              >
                <span className="text-sm font-bold" style={{ color: '#fff' }}>
                  {summaryOpen
                    ? 'Order Summary'
                    : `${itemCount} dozen${itemCount !== 1 ? 's' : ''} · ₹${totalAmount}`}
                </span>
                <span style={{ color: '#999' }}>
                  <ChevronIcon open={summaryOpen} />
                </span>
              </button>

              {/* Expanded rows */}
              {summaryOpen && (
                <div className="border-t px-4 pb-2" style={{ borderColor: '#3D3D3D' }}>
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 py-3 border-b last:border-b-0"
                      style={{ borderColor: '#3D3D3D' }}
                    >
                      {/* 48px thumbnail */}
                      <img
                        src={item.image_url || '/logo.jpeg'}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        style={{ border: '1px solid #3D3D3D' }}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>
                          {item.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#999' }}>
                          {item.dozens} doz × {item.dozens * 12} pcs
                        </p>
                      </div>
                      <span className="text-sm font-black flex-shrink-0" style={{ color: '#F5C200' }}>
                        ₹{item.price_per_dozen * item.dozens}
                      </span>
                    </div>
                  ))}

                  {/* Summary total row */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#999' }}>Total</span>
                    <span className="text-lg font-black" style={{ color: '#F5C200' }}>₹{totalAmount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── [3] DELIVERY DATE ─────────────────────────────────────── */}
            <div
              className="rounded-2xl border px-4 py-4"
              style={{ backgroundColor: '#1E1E1E', borderColor: '#3D3D3D' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#999' }}>
                Delivery Date <span style={{ color: '#ef4444' }}>*</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { date: saturday, label: 'Saturday', dateStr: satStr, isFull: satFull, count: satCount },
                  { date: sunday, label: 'Sunday', dateStr: sunStr, isFull: sunFull, count: sunCount },
                ].map(({ date, label, dateStr, isFull, count }) => {
                  const isSelected = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === dateStr : false;
                  const slotsLeft = Math.max(0, MAX_SLOTS - count);
                  const isLow = !isFull && slotsLeft <= 5;

                  return (
                    <button
                      key={dateStr}
                      disabled={isFull}
                      onClick={() => !isFull && setSelectedDate(date)}
                      className="relative rounded-xl py-3 px-4 text-left transition-all duration-200 border min-h-[80px]"
                      style={{
                        backgroundColor: isSelected ? 'rgba(245,194,0,0.1)' : '#2B2B2B',
                        borderColor: isSelected ? '#F5C200' : '#3D3D3D',
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: '#F5C200', color: '#1E1E1E' }}
                        >
                          ✓
                        </span>
                      )}
                      <p className="text-sm font-black" style={{ color: isFull ? '#999' : '#fff' }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#999' }}>{format(date, 'd MMM')}</p>

                      {isFull ? (
                        <span
                          className="mt-2 inline-block text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}
                        >
                          Sold Out
                        </span>
                      ) : isLow ? (
                        <span className="mt-2 block text-[10px] font-bold" style={{ color: '#F5C200' }}>
                          ⚠️ {slotsLeft} left!
                        </span>
                      ) : (
                        <span className="mt-2 block text-[10px] font-semibold" style={{ color: '#999' }}>
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
            <div
              className="rounded-2xl border px-4 py-4"
              style={{ backgroundColor: '#1E1E1E', borderColor: '#3D3D3D' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#999' }}>
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
            <div
              className="rounded-2xl border px-4 py-4 space-y-3"
              style={{ backgroundColor: '#1E1E1E', borderColor: '#3D3D3D' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#999' }}>
                Payment Method
              </p>

              {/* UPI card */}
              <button
                onClick={() => setPaymentMethod('UPI')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 min-h-[64px]"
                style={{
                  backgroundColor: paymentMethod === 'UPI' ? 'rgba(245,194,0,0.08)' : '#2B2B2B',
                  borderColor: paymentMethod === 'UPI' ? '#F5C200' : '#3D3D3D',
                }}
              >
                <span className="text-2xl">📲</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#fff' }}>Pay Online (UPI)</p>
                  <p className="text-xs mt-0.5" style={{ color: '#999' }}>Scan QR · GPay / PhonePe / Paytm</p>
                </div>
                {paymentMethod === 'UPI' && (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                    style={{ backgroundColor: '#F5C200', color: '#1E1E1E' }}
                  >
                    ✓
                  </span>
                )}
              </button>

              {/* COD card */}
              <button
                onClick={() => setPaymentMethod('COD')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 min-h-[64px]"
                style={{
                  backgroundColor: paymentMethod === 'COD' ? 'rgba(245,194,0,0.08)' : '#2B2B2B',
                  borderColor: paymentMethod === 'COD' ? '#F5C200' : '#3D3D3D',
                }}
              >
                <span className="text-2xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#fff' }}>Cash on Delivery</p>
                  <p className="text-xs mt-0.5" style={{ color: '#999' }}>Pay ₹{totalAmount} on arrival</p>
                </div>
                {paymentMethod === 'COD' && (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                    style={{ backgroundColor: '#F5C200', color: '#1E1E1E' }}
                  >
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
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3"
        style={{
          backgroundColor: '#2B2B2B',
          borderTop: '1px solid #3D3D3D',
          paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={handlePlaceOrder}
          disabled={isDisabled}
          className="w-full py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 min-h-[52px]"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            backgroundColor: isDisabled ? '#3D3D3D' : '#F5C200',
            color: isDisabled ? '#999' : '#1E1E1E',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            boxShadow: isDisabled ? 'none' : '0 0 24px rgba(245,194,0,0.25)',
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
          <p className="text-center text-[11px] mt-2" style={{ color: '#999' }}>
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
