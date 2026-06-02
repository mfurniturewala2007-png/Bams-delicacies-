import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { supabase } from '../utils/supabase';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';
import DeliveryPicker from './DeliveryPicker';
import PaymentModal from './PaymentModal';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

interface OrderFormProps {
  isDark?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ isDark = false }) => {
  const { items, totalAmount, clearCart } = useCart();
  const { profile, openAuthModal } = useAuth();

  // Inputs state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');

  // Prefill fields when profile details load
  useEffect(() => {
    if (profile) {
      setCustomerName(profile.name || '');
      setCustomerPhone((profile.phone || '').replace(/[^0-9]/g, '').slice(-10));
      setCustomerAddress(profile.address || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  }, [profile]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Database slots states
  const [orders, setOrders] = useState<{ delivery_date: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Payment modal state
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentTotal, setPaymentTotal] = useState<number>(0);
  const [paymentSelectedDate, setPaymentSelectedDate] = useState<Date | null>(null);

  // Dynamic self-contained Toast notifications state
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });

  const { saturday, sunday } = getAvailableDeliveryDates();
  const dbSatStr = format(saturday, 'yyyy-MM-dd');
  const dbSunStr = format(sunday, 'yyyy-MM-dd');

  const [maxOrdersSatLimit, setMaxOrdersSatLimit] = useState(15);
  const [maxOrdersSunLimit, setMaxOrdersSunLimit] = useState(15);
  const [festivalDeliveryDate, setFestivalDeliveryDate] = useState('2026-06-12');

  const formatDbDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return format(dateObj, 'eeee, MMMM d, yyyy');
    }
    return dateStr;
  };

  // Fetch orders count on mount to populate slot calculations
  const fetchOrdersForWeekend = async () => {
    try {
      const datesToFetch = [dbSatStr, dbSunStr];
      if (festivalDeliveryDate && !datesToFetch.includes(festivalDeliveryDate)) {
        datesToFetch.push(festivalDeliveryDate);
      }
      const { data, error } = await supabase
        .from('orders')
        .select('delivery_date')
        .in('delivery_date', datesToFetch);

      if (error) throw error;
      if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('Failed to load slots count. Falling back to default simulated capacities.');
    }
  };

  const fetchMaxOrders = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['max_orders_per_day', 'max_orders_saturday', 'max_orders_sunday', 'festival_deal_delivery_date']);

      if (data) {
        const general = data.find(r => r.key === 'max_orders_per_day')?.value || '15';
        const sat = data.find(r => r.key === 'max_orders_saturday')?.value || general;
        const sun = data.find(r => r.key === 'max_orders_sunday')?.value || general;
        const festDeliv = data.find(r => r.key === 'festival_deal_delivery_date')?.value || '2026-06-12';
        
        setMaxOrdersSatLimit(Number(sat));
        setMaxOrdersSunLimit(Number(sun));
        setFestivalDeliveryDate(festDeliv);
      }
    } catch (err) {
      console.warn('Failed to fetch settings from Supabase. Falling back to defaults.');
    }
  };

  useEffect(() => {
    fetchMaxOrders();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      fetchOrdersForWeekend();
    }
  }, [items, dbSatStr, dbSunStr, festivalDeliveryDate]);

  const hasFestiveItem = items.some(item => item.category === 'Pheli Raat');

  // Lock delivery date automatically if there is a festive item in the cart
  useEffect(() => {
    if (hasFestiveItem && festivalDeliveryDate) {
      const parts = festivalDeliveryDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);
        setSelectedDate(dateObj);
        if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: '' }));
      }
    } else if (!hasFestiveItem && selectedDate && format(selectedDate, 'yyyy-MM-dd') === festivalDeliveryDate) {
      setSelectedDate(null);
    }
  }, [hasFestiveItem, festivalDeliveryDate]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  const handlePlaceOrder = async () => {
    const errors: { [key: string]: string } = {};

    // 1. Validate Form Fields
    if (!customerName.trim()) {
      errors.name = 'Full Name is required';
    }

    if (!customerPhone.trim()) {
      errors.phone = 'Phone Number is required';
    } else if (!/^[0-9]{10}$/.test(customerPhone.trim())) {
      errors.phone = 'Enter valid 10-digit number';
    }

    if (!customerAddress.trim()) {
      errors.address = 'Delivery Address is required';
    }

    if (!selectedDate) {
      errors.date = 'Please select a delivery date';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Please correct errors before placing order.', 'error');
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const deliveryDateStr = format(selectedDate!, 'yyyy-MM-dd');

      if (paymentMethod === 'COD') {
        // Direct COD Placement Flow!
        const newOrder = {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
          delivery_date: deliveryDateStr,
          items: items,
          total: totalAmount,
          status: 'pending', // Directly confirmed pending order
          upi_transaction_id: 'COD', // Mark it as Cash on Delivery
        };

        const { error } = await supabase
          .from('orders')
          .insert([newOrder])
          .select('id')
          .single();

        if (error) throw error;

        // Show Success Toast directly!
        showToast(
          `Order placed successfully! Confirmed for Cash on Delivery on ${format(selectedDate!, 'EEE, MMM d')} 🎉`,
          'success'
        );

        // Reset local fields
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setSelectedDate(null);

        // Clear Cart Context
        clearCart();

        // Scroll smoothly to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } else {
        // UPI Online Payment Flow
        const newOrder = {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
          delivery_date: deliveryDateStr,
          items: items,
          total: totalAmount,
          status: 'payment_pending',
        };

        const { data, error } = await supabase
          .from('orders')
          .insert([newOrder])
          .select('id')
          .single();

        if (error) throw error;

        // Store selected date for post-payment success toast, open PaymentModal
        setPaymentSelectedDate(selectedDate);
        setPaymentTotal(totalAmount);
        setPaymentOrderId(data.id);
      }

    } catch (err: any) {
      console.error('Error inserting order to Supabase:', err);
      showToast(
        err.message || 'Failed to place order. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called when user clicks "I've Paid ✓" in PaymentModal
  const handlePaymentConfirmed = () => {
    setPaymentOrderId(null);

    // Show success toast
    showToast(
      `Payment received! Order confirmed for ${format(paymentSelectedDate!, 'EEE, MMM d')} 🎉`,
      'success'
    );

    // Reset local fields
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedDate(null);

    // Clear Cart Context
    clearCart();

    // Scroll smoothly to top of window
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Called when user clicks "Cancel Order" in PaymentModal
  const handlePaymentCancelled = () => {
    setPaymentOrderId(null);
    showToast('Order cancelled. Your cart is still saved.', 'error');
  };

  // If cart is empty, show user friendly helper warning
  if (items.length === 0) {
    return (
      <section id="order" className={`py-16 px-4 md:py-24 md:px-12 text-center relative ${
        isDark ? 'bg-transparent text-[#FFFAF4]' : 'bg-surface-2 border-t border-border/40'
      }`}>
        <div className={`max-w-md mx-auto p-8 border border-dashed rounded-2xl animate-fade-slide-up ${
          isDark ? 'border-[#DFBA73]/30 bg-[#150F0A]/50' : 'border-border bg-bg/50'
        }`}>
          <span className="text-4xl">🛒</span>
          <h2 className={`font-serif font-bold text-xl mt-4 ${isDark ? 'text-[#DFBA73]' : 'text-heading'}`}>
            Your Cart is Empty
          </h2>
          <p className={`text-sm mt-2 mb-6 leading-relaxed ${isDark ? 'text-[#FFFAF4]/70' : 'text-muted'}`}>
            Add items to your cart first 👆
          </p>
          <a
            href="#menu"
            className={`inline-flex font-sans font-bold text-sm px-6 py-3 rounded-full transition-all duration-300 ${
              isDark
                ? 'bg-[#E3A857] text-[#150F0A] hover:bg-[#DFBA73] shadow-[0_0_15px_rgba(227,168,87,0.2)]'
                : 'bg-primary text-white shadow-primary hover:bg-primary-hover'
            }`}
          >
            Browse Menu
          </a>
        </div>
      </section>
    );
  }

  // If user is not logged in, show mandatory "Sign in to order" prompt card
  if (!profile) {
    return (
      <section id="order" className={`py-16 px-4 md:py-24 md:px-12 text-center relative ${
        isDark ? 'bg-transparent text-[#FFFAF4]' : 'bg-surface-2 border-t border-border/40'
      }`}>
        <div className={`max-w-md mx-auto p-8 border rounded-2xl animate-fade-slide-up ${
          isDark
            ? 'border-[#DFBA73]/15 bg-[#150F0A]/95 shadow-2xl'
            : 'border-border bg-surface shadow-card'
        }`}>
          <span className="text-4xl animate-float" style={{ animationDuration: '4s' }}>👋</span>
          <h2 className={`font-serif font-black text-2xl mt-4 ${isDark ? 'text-[#DFBA73]' : 'text-heading'}`}>
            Sign In to Complete Your Order
          </h2>
          <p className={`text-sm mt-2 mb-6 leading-relaxed font-sans ${isDark ? 'text-[#FFFAF4]/70' : 'text-muted'}`}>
            To place your order and reserve a gourmet weekend delivery slot, please sign in or create an account with us. We will securely save your details for all future orders!
          </p>
          <button
            onClick={openAuthModal}
            className={`w-full font-sans font-black uppercase tracking-wider py-3.5 rounded-xl transition-all duration-300 select-none focus:outline-none ${
              isDark
                ? 'bg-[#E3A857] text-[#150F0A] hover:bg-[#DFBA73] shadow-[0_0_15px_rgba(227,168,87,0.2)] hover:scale-[1.02] active:scale-98'
                : 'bg-yellow text-bg hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98'
            }`}
          >
            Sign In to Order
          </button>
        </div>
      </section>
    );
  }

  if (isDark) {
    // Elegant nested rendering without section background for the Pheli Raat dark theme
    return (
      <div className="w-full text-left relative">
        {/* Toast Alert Box */}
        {toast.visible && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-slide-in-right bg-[#150F0A] border-[#DFBA73]/30 text-[#FFFAF4] shadow-[#DFBA73]/10`}
          >
            <span className="text-xl">{toast.type === 'success' ? '🎉' : '❌'}</span>
            <div className="flex flex-col text-left">
              <span className="font-sans font-bold text-sm text-[#DFBA73]">
                {toast.type === 'success' ? 'Success!' : 'Error'}
              </span>
              <span className="font-sans text-xs text-[#FFFAF4]/80 mt-0.5">
                {toast.message}
              </span>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentOrderId && (
          <PaymentModal
            orderId={paymentOrderId}
            totalAmount={paymentTotal}
            onConfirmed={handlePaymentConfirmed}
            onCancel={handlePaymentCancelled}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Column 1: Client Fields (7 spans) */}
          <div className="lg:col-span-7 space-y-6 bg-[#150F0A]/95 border border-[#DFBA73]/15 rounded-2xl p-5 md:p-8 shadow-2xl">
            
            {/* Full Name field */}
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-[#FFFAF4]/85 uppercase tracking-wider mb-2">
                Full Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Enter your full name"
                className="w-full bg-[#150F0A]/60 border border-[#DFBA73]/15 rounded-xl px-4 py-3 text-[#FFFAF4] font-sans placeholder:text-[#FFFAF4]/40 focus:outline-none focus:border-[#E3A857] focus:ring-2 focus:ring-[#E3A857]/20 transition-all duration-200"
              />
              {fieldErrors.name && (
                <span className="text-[#E3A857] text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.name}
                </span>
              )}
            </div>

            {/* Phone Number field */}
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-[#FFFAF4]/85 uppercase tracking-wider mb-2">
                Phone Number <span className="text-primary">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                maxLength={10}
                onChange={(e) => {
                  setCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="Enter 10-digit contact number"
                className="w-full bg-[#150F0A]/60 border border-[#DFBA73]/15 rounded-xl px-4 py-3 text-[#FFFAF4] font-sans placeholder:text-[#FFFAF4]/40 focus:outline-none focus:border-[#E3A857] focus:ring-2 focus:ring-[#E3A857]/20 transition-all duration-200"
              />
              {fieldErrors.phone && (
                <span className="text-[#E3A857] text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.phone}
                </span>
              )}
            </div>

            {/* Address field */}
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-[#FFFAF4]/85 uppercase tracking-wider mb-2">
                Delivery Address <span className="text-primary">*</span>
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="Provide detailed house number, landmark, street, and area info"
                rows={3}
                className="w-full bg-[#150F0A]/60 border border-[#DFBA73]/15 rounded-xl px-4 py-3 text-[#FFFAF4] font-sans placeholder:text-[#FFFAF4]/40 focus:outline-none focus:border-[#E3A857] focus:ring-2 focus:ring-[#E3A857]/20 transition-all duration-200 resize-none"
              />
              {fieldErrors.address && (
                <span className="text-[#E3A857] text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.address}
                </span>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-[#FFFAF4]/85 uppercase tracking-wider mb-3">
                Payment Method <span className="text-primary">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none focus:outline-none ${
                    paymentMethod === 'UPI'
                      ? 'bg-[#E3A857]/10 border-[#E3A857] shadow-[0_0_15px_rgba(227,168,87,0.15)] text-[#FFFAF4]'
                      : 'bg-[#150F0A]/40 border-[#DFBA73]/15 hover:border-[#DFBA73]/40 text-[#FFFAF4]/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📲</span>
                    <span className={`font-sans font-bold text-sm ${paymentMethod === 'UPI' ? 'text-[#E3A857]' : 'text-[#FFFAF4]'}`}>Pay Online (UPI)</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed text-[#FFFAF4]/65">
                    Scan UPI QR code after placing order to confirm.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none focus:outline-none ${
                    paymentMethod === 'COD'
                      ? 'bg-[#E3A857]/10 border-[#E3A857] shadow-[0_0_15px_rgba(227,168,87,0.15)] text-[#FFFAF4]'
                      : 'bg-[#150F0A]/40 border-[#DFBA73]/15 hover:border-[#DFBA73]/40 text-[#FFFAF4]/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <span className={`font-sans font-bold text-sm ${paymentMethod === 'COD' ? 'text-[#E3A857]' : 'text-[#FFFAF4]'}`}>Cash on Delivery</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed text-[#FFFAF4]/65">
                    Place order directly. Pay cash upon delivery.
                  </p>
                </button>
              </div>
            </div>

            {/* Embedded Delivery Slot Picker / Lock Banner */}
            <div className="pt-2">
              <label className="block text-left text-sm font-sans font-semibold text-[#FFFAF4]/85 uppercase tracking-wider mb-3">
                Delivery Date <span className="text-primary">*</span>
              </label>
              <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 to-[#E3A857]/15 border border-[#DFBA73]/30 text-left shadow-[0_0_20px_rgba(223,186,115,0.08)]">
                <div className="flex items-center gap-2 text-[#E3A857] font-black uppercase tracking-wider text-xs mb-1.5 animate-pulse">
                  <span>✨ Pheli Raat Special Delivery Slot ✨</span>
                </div>
                <p className="text-[#FFFAF4] font-black text-lg">
                  {selectedDate ? format(selectedDate, 'eeee, MMMM d, yyyy') : formatDbDate(festivalDeliveryDate)}
                </p>
                <p className="text-[#FFFAF4]/70 text-xs mt-1 leading-relaxed font-sans">
                  Your order contains premium Pheli Raat festival combos and is locked for special festival-day delivery.
                </p>
              </div>
              {fieldErrors.date && (
                <span className="text-[#E3A857] text-xs font-sans font-semibold text-left mt-2 block">
                  {fieldErrors.date}
                </span>
              )}
            </div>

          </div>

          {/* Column 2: Order Summary card (5 spans) */}
          <div className="lg:col-span-5 bg-[#150F0A]/95 border border-[#DFBA73]/15 rounded-2xl p-5 md:p-8 shadow-2xl flex flex-col justify-between self-start text-[#FFFAF4]">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#DFBA73] border-b border-[#DFBA73]/15 pb-4 text-left">
                Order Summary
              </h3>

              {/* Items list map */}
              <div className="divide-y divide-[#DFBA73]/10 max-h-80 overflow-y-auto mt-4 pr-1">
                {items.map((item) => (
                  <div key={item.product_id} className="py-3 flex items-center justify-between gap-4">
                    <div className="text-left min-w-0">
                      <span className="font-sans font-bold text-sm text-[#FFFAF4] block truncate">
                        {item.name}
                      </span>
                      <span className="text-[#FFFAF4]/60 text-xs font-sans mt-0.5 block">
                        ₹{item.price_per_dozen} × {item.dozens} doz ({item.dozens * 12} pcs)
                      </span>
                    </div>
                    <span className="font-serif text-sm font-bold text-[#E3A857] flex-shrink-0">
                      ₹{item.price_per_dozen * item.dozens}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotals & Programmatic Submit Button */}
            <div className="mt-8 pt-6 border-t border-[#DFBA73]/15 space-y-6">
              <div className="flex items-baseline justify-between">
                <span className="font-sans font-semibold text-[#FFFAF4]/60 text-xs uppercase tracking-wider">
                  Total Amount
                </span>
                <span className="font-serif text-3xl font-black text-[#E3A857]">
                  ₹{totalAmount}
                </span>
              </div>

              {/* payment badge */}
              {paymentMethod === 'UPI' ? (
                <div className="flex items-center gap-2 text-[#FFFAF4]/80 text-xs font-sans bg-[#201710]/95 border border-[#DFBA73]/15 rounded-xl px-4 py-2.5">
                  <span className="text-base">📲</span>
                  <span>Pay via UPI QR after clicking Place Order</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#FFFAF4]/80 text-xs font-sans bg-[#201710]/95 border border-[#DFBA73]/15 rounded-xl px-4 py-2.5">
                  <span className="text-base">💵</span>
                  <span>Pay cash upon delivery. No upfront payment required!</span>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-full font-sans font-bold text-base shadow-[0_0_20px_rgba(227,168,87,0.2)] transition-all duration-300 flex items-center justify-center gap-2 select-none ${
                  isSubmitting
                    ? 'bg-[#201710]/90 text-[#FFFAF4]/40 border border-[#DFBA73]/15 cursor-not-allowed shadow-none'
                    : 'bg-[#E3A857] text-[#150F0A] hover:bg-[#DFBA73] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(227,168,87,0.4)]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#150F0A]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>{paymentMethod === 'COD' ? 'Place COD Order 📦' : 'Place Order & Pay 🎉'}</span>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <section id="order" className="py-16 px-4 md:py-24 md:px-12 bg-surface-2 border-t border-border/40 relative">

      {/* Payment Modal — rendered above everything when order is inserted */}
      {paymentOrderId && (
        <PaymentModal
          orderId={paymentOrderId}
          totalAmount={paymentTotal}
          onConfirmed={handlePaymentConfirmed}
          onCancel={handlePaymentCancelled}
        />
      )}

      {/* Toast Alert Box */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-auto z-50 p-5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-surface border-primary text-text shadow-primary'
              : 'bg-surface border-error/50 text-error shadow-lg'
          }`}
        >
          <span className="text-xl">{toast.type === 'success' ? '🎉' : '❌'}</span>
          <div className="flex flex-col text-left">
            <span className="font-sans font-bold text-sm">
              {toast.type === 'success' ? 'Success!' : 'Error'}
            </span>
            <span className="font-sans text-xs text-text/80 mt-0.5">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-serif font-black text-3xl md:text-6xl text-heading tracking-tight">
            Complete Your Order
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full shadow-primary" />
          <p className="text-muted text-sm md:text-base mt-4 max-w-md mx-auto leading-relaxed">
            Please fill in your delivery details and choose a convenient weekend slot to reserve.
          </p>
        </div>

        {/* 2 Column Form + Summary Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-4">
          
          {/* Column 1: Client Fields (7 spans) */}
          <div className="lg:col-span-7 space-y-6 bg-surface border border-border rounded-2xl p-5 md:p-8 shadow-card text-left">
            
            {/* Full Name field */}
            <div>
              <label className="block text-sm font-sans font-semibold text-text uppercase tracking-wider mb-2">
                Full Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Enter your full name"
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/65 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  fieldErrors.name ? 'border-error' : 'border-border'
                }`}
              />
              {fieldErrors.name && (
                <span className="text-error text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.name}
                </span>
              )}
            </div>

            {/* Phone Number field */}
            <div>
              <label className="block text-sm font-sans font-semibold text-text uppercase tracking-wider mb-2">
                Phone Number <span className="text-primary">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                maxLength={10}
                onChange={(e) => {
                  setCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="Enter 10-digit contact number"
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/65 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  fieldErrors.phone ? 'border-error' : 'border-border'
                }`}
              />
              {fieldErrors.phone && (
                <span className="text-error text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.phone}
                </span>
              )}
            </div>

            {/* Address field */}
            <div>
              <label className="block text-sm font-sans font-semibold text-text uppercase tracking-wider mb-2">
                Delivery Address <span className="text-primary">*</span>
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="Provide detailed house number, landmark, street, and area info"
                rows={3}
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-sans placeholder:text-muted/65 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none ${
                  fieldErrors.address ? 'border-error' : 'border-border'
                }`}
              />
              {fieldErrors.address && (
                <span className="text-error text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.address}
                </span>
              )}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-sans font-semibold text-text uppercase tracking-wider mb-3">
                Payment Method <span className="text-primary">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none focus:outline-none ${
                    paymentMethod === 'UPI'
                      ? 'bg-primary/5 border-primary shadow-sm text-text'
                      : 'bg-surface-2 border-border hover:border-primary/50 text-text/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📲</span>
                    <span className={`font-sans font-bold text-sm ${paymentMethod === 'UPI' ? 'text-primary' : 'text-text'}`}>Pay Online (UPI)</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed text-muted">
                    Scan UPI QR code after placing order to confirm.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 select-none focus:outline-none ${
                    paymentMethod === 'COD'
                      ? 'bg-primary/5 border-primary shadow-sm text-text'
                      : 'bg-surface-2 border-border hover:border-primary/50 text-text/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <span className={`font-sans font-bold text-sm ${paymentMethod === 'COD' ? 'text-primary' : 'text-text'}`}>Cash on Delivery</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed text-muted">
                    Place order directly. Pay cash upon delivery.
                  </p>
                </button>
              </div>
            </div>

            {/* Embedded Delivery Slot Picker / Lock Banner */}
            <div className="pt-2">
              {hasFestiveItem ? (
                <div className="w-full">
                  <label className="block text-left text-sm font-sans font-semibold text-text uppercase tracking-wider mb-3">
                    Delivery Date <span className="text-primary">*</span>
                  </label>
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 to-yellow/15 border border-primary/30 text-left shadow-yellow animate-pulse-glow">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-xs mb-1.5">
                      <span>✨ Pheli Raat Special Delivery Slot ✨</span>
                    </div>
                    <p className="text-text font-black text-lg">
                      {selectedDate ? format(selectedDate, 'eeee, MMMM d, yyyy') : formatDbDate(festivalDeliveryDate)}
                    </p>
                    <p className="text-muted text-xs mt-1 leading-relaxed">
                      Your order contains premium Pheli Raat festival combos and is locked for special festival-day delivery.
                    </p>
                  </div>
                </div>
              ) : (
                <DeliveryPicker
                  selectedDate={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  orders={orders}
                  maxOrdersSatLimit={maxOrdersSatLimit}
                  maxOrdersSunLimit={maxOrdersSunLimit}
                  festivalDeliveryDate={festivalDeliveryDate}
                />
              )}
              {fieldErrors.date && (
                <span className="text-error text-xs font-sans font-semibold text-left mt-2 block">
                  {fieldErrors.date}
                </span>
              )}
            </div>

          </div>

          {/* Column 2: Order Summary card (5 spans) */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-5 md:p-8 shadow-card flex flex-col justify-between self-start text-left">
            <div>
              <h3 className="font-serif font-bold text-xl text-heading border-b border-border pb-4 text-left">
                Order Summary
              </h3>

              {/* Items list map */}
              <div className="divide-y divide-border/60 max-h-80 overflow-y-auto mt-4 pr-1">
                {items.map((item) => (
                  <div key={item.product_id} className="py-3 flex items-center justify-between gap-4">
                    <div className="text-left min-w-0">
                      <span className="font-sans font-bold text-sm text-text block truncate">
                        {item.name}
                      </span>
                      <span className="text-muted text-xs font-sans mt-0.5 block">
                        ₹{item.price_per_dozen} × {item.dozens} doz ({item.dozens * 12} pcs)
                      </span>
                    </div>
                    <span className="font-serif text-sm font-bold text-text flex-shrink-0">
                      ₹{item.price_per_dozen * item.dozens}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotals & Programmatic Submit Button */}
            <div className="mt-8 pt-6 border-t border-border space-y-6">
              <div className="flex items-baseline justify-between">
                <span className="font-sans font-semibold text-muted text-xs uppercase tracking-wider">
                  Total Amount
                </span>
                <span className="font-serif text-3xl font-black text-yellow">
                  ₹{totalAmount}
                </span>
              </div>

              {/* payment badge */}
              {paymentMethod === 'UPI' ? (
                <div className="flex items-center gap-2 text-muted text-xs font-sans bg-surface-2 border border-border rounded-xl px-4 py-2.5">
                  <span className="text-base">📲</span>
                  <span>Pay via UPI QR after clicking Place Order</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted text-xs font-sans bg-surface-2 border border-border rounded-xl px-4 py-2.5">
                  <span className="text-base">💵</span>
                  <span>Pay cash upon delivery. No upfront payment required!</span>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-full font-sans font-bold text-base shadow-primary transition-all duration-300 flex items-center justify-center gap-2 select-none ${
                  isSubmitting
                    ? 'bg-surface-2 text-muted/50 border border-border cursor-not-allowed shadow-none'
                    : 'bg-primary text-white hover:bg-primary-hover hover:scale-[1.02] hover:shadow-primary-strong'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-muted"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>{paymentMethod === 'COD' ? 'Place COD Order 📦' : 'Place Order & Pay 🎉'}</span>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default OrderForm;
