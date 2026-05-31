import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { format } from 'date-fns';
import { supabase } from '../utils/supabase';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';
import DeliveryPicker from './DeliveryPicker';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

const OrderForm: React.FC = () => {
  const { items, totalAmount, clearCart } = useCart();

  // Inputs state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Database slots states
  const [orders, setOrders] = useState<{ delivery_date: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Dynamic self-contained Toast notifications state
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });

  const { saturday, sunday } = getAvailableDeliveryDates();
  const dbSatStr = format(saturday, 'yyyy-MM-dd');
  const dbSunStr = format(sunday, 'yyyy-MM-dd');

  // Fetch orders count on mount to populate slot calculations
  const fetchOrdersForWeekend = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('delivery_date')
        .in('delivery_date', [dbSatStr, dbSunStr]);

      if (error) throw error;
      if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('Failed to load slots count. Falling back to default simulated capacities.');
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      fetchOrdersForWeekend();
    }
  }, [items, dbSatStr, dbSunStr]);

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

      // 2. Prepare payload exactly matching Supabase Orders Table Schema
      const newOrder = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        delivery_date: deliveryDateStr,
        items: items, // CartItem[] array
        total: totalAmount,
        status: 'pending',
      };

      // 3. Insert record into Supabase orders
      const { error } = await supabase
        .from('orders')
        .insert([newOrder]);

      if (error) throw error;

      // 4. Successful checkout operations
      showToast(
        `Order placed! See you ${format(selectedDate!, 'EEE, MMM d')} 🎉`,
        'success'
      );

      // Reset local fields & Cart state
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setSelectedDate(null);
      
      // Clear Cart Context
      clearCart();

      // Scroll smoothly to top of window
      window.scrollTo({ top: 0, behavior: 'smooth' });

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

  // If cart is empty, show user friendly helper warning
  if (items.length === 0) {
    return (
      <section id="order" className="py-24 px-6 md:px-12 bg-surface-2 border-t border-border/40 text-center relative">
        <div className="max-w-md mx-auto p-8 border border-dashed border-border bg-bg/50 rounded-2xl animate-fade-slide-up">
          <span className="text-4xl">🛒</span>
          <h2 className="font-serif font-bold text-xl text-yellow mt-4">
            Your Cart is Empty
          </h2>
          <p className="text-muted text-sm mt-2 mb-6 leading-relaxed">
            Add items to your cart first 👆
          </p>
          <a
            href="#menu"
            className="inline-flex bg-yellow text-bg font-sans font-bold text-sm px-6 py-3 rounded-full hover:bg-yellow-dim transition-all duration-300"
          >
            Browse Menu
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="py-24 px-6 md:px-12 bg-surface-2 border-t border-border/40 relative">
      {/* Toast Alert Box */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-surface border-yellow text-white shadow-yellow'
              : 'bg-surface border-error/50 text-error shadow-lg'
          }`}
        >
          <span className="text-xl">{toast.type === 'success' ? '🎉' : '❌'}</span>
          <div className="flex flex-col text-left">
            <span className="font-sans font-bold text-sm">
              {toast.type === 'success' ? 'Success!' : 'Error'}
            </span>
            <span className="font-sans text-xs text-white/80 mt-0.5">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="font-serif font-black text-4xl md:text-6xl text-white tracking-tight">
            Complete Your Order
          </h2>
          <div className="w-20 h-1 bg-yellow mx-auto mt-4 rounded-full shadow-yellow" />
          <p className="text-muted text-sm md:text-base mt-4 max-w-md mx-auto leading-relaxed">
            Please fill in your delivery details and choose a convenient weekend slot to reserve.
          </p>
        </div>

        {/* 2 Column Form + Summary Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-4">
          
          {/* Column 1: Client Fields (7 spans) */}
          <div className="lg:col-span-7 space-y-6 bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-card">
            
            {/* Full Name field */}
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-white/90 uppercase tracking-wider mb-2">
                Full Name <span className="text-yellow">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="Enter your full name"
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-white font-sans placeholder:text-muted focus:outline-none focus:border-yellow focus:ring-2 focus:ring-yellow-glow transition-all duration-200 ${
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
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-white/90 uppercase tracking-wider mb-2">
                Phone Number <span className="text-yellow">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="Enter 10-digit contact number"
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-white font-sans placeholder:text-muted focus:outline-none focus:border-yellow focus:ring-2 focus:ring-yellow-glow transition-all duration-200 ${
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
            <div className="text-left">
              <label className="block text-sm font-sans font-semibold text-white/90 uppercase tracking-wider mb-2">
                Delivery Address <span className="text-yellow">*</span>
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="Provide detailed house number, landmark, street, and area info"
                rows={3}
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-white font-sans placeholder:text-muted focus:outline-none focus:border-yellow focus:ring-2 focus:ring-yellow-glow transition-all duration-200 resize-none ${
                  fieldErrors.address ? 'border-error' : 'border-border'
                }`}
              />
              {fieldErrors.address && (
                <span className="text-error text-xs font-sans font-semibold mt-1 block">
                  {fieldErrors.address}
                </span>
              )}
            </div>

            {/* Embedded Delivery Slot Picker */}
            <div className="pt-2">
              <DeliveryPicker
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: '' }));
                }}
                orders={orders}
              />
              {fieldErrors.date && (
                <span className="text-error text-xs font-sans font-semibold text-left mt-2 block">
                  {fieldErrors.date}
                </span>
              )}
            </div>

          </div>

          {/* Column 2: Order Summary card (5 spans) */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-card flex flex-col justify-between self-start">
            <div>
              <h3 className="font-serif font-bold text-xl text-yellow border-b border-border pb-4 text-left">
                Order Summary
              </h3>

              {/* Items list map */}
              <div className="divide-y divide-border/60 max-h-80 overflow-y-auto mt-4 pr-1">
                {items.map((item) => (
                  <div key={item.product_id} className="py-3 flex items-center justify-between gap-4">
                    <div className="text-left min-w-0">
                      <span className="font-sans font-bold text-sm text-white/95 block truncate">
                        {item.name}
                      </span>
                      <span className="text-muted text-xs font-sans mt-0.5 block">
                        ₹{item.price} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-serif text-sm font-bold text-white/90 flex-shrink-0">
                      ₹{item.price * item.quantity}
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

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-full font-sans font-bold text-base shadow-yellow transition-all duration-300 flex items-center justify-center gap-2 select-none ${
                  isSubmitting
                    ? 'bg-surface-2 text-muted/50 border border-border cursor-not-allowed shadow-none'
                    : 'bg-yellow text-bg hover:bg-yellow-dim hover:scale-[1.02] hover:shadow-yellow-strong active:scale-98'
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
                  <span>Place Order 🎉</span>
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
