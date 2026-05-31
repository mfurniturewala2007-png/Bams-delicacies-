import React from 'react';
import { format } from 'date-fns';
import { getAvailableDeliveryDates } from '../utils/deliveryDates';

interface DeliveryPickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  orders: { delivery_date: string }[];
  maxOrdersLimit?: number; // Dynamic limit passed from OrderForm
}

const DeliveryPicker: React.FC<DeliveryPickerProps> = ({
  selectedDate,
  onSelect,
  orders,
  maxOrdersLimit = 15,
}) => {
  const { saturday, sunday } = getAvailableDeliveryDates();

  const options = [
    { date: saturday, label: 'Saturday' },
    { date: sunday, label: 'Sunday' },
  ];

  const selectedStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  return (
    <div className="w-full">
      <label className="block text-left text-sm font-sans font-semibold text-text uppercase tracking-wider mb-3">
        Select Delivery Date <span className="text-primary">*</span>
      </label>

      {/* Side-by-Side (2 cols) Weekend Picker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map(({ date, label }) => {
          const cardStr = format(date, 'yyyy-MM-dd');
          const isSelected = cardStr === selectedStr;
          
          // Calculate slots dynamically based on the passed maxOrdersLimit
          const count = orders.filter((o) => o.delivery_date === cardStr).length;
          const slotsLeft = Math.max(0, maxOrdersLimit - count);

          const isFull = slotsLeft === 0;
          const isLowSlots = slotsLeft > 0 && slotsLeft <= 5;

          return (
            <div
              key={cardStr}
              onClick={() => {
                if (!isFull) onSelect(date);
              }}
              className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 select-none flex flex-col justify-between h-36 ${
                isFull
                  ? 'bg-surface border-border opacity-50 cursor-not-allowed pointer-events-none'
                  : isSelected
                  ? 'bg-surface-2 border-primary shadow-primary text-text hover:scale-[1.01]'
                  : 'bg-surface border-border hover:border-primary/50 text-text/80 hover:scale-[1.01]'
              }`}
            >
              {/* Day & Date Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-sans font-extrabold text-lg tracking-tight">
                    {label}
                  </span>
                  {isFull && (
                    <span className="bg-error/15 border border-error text-error text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Full 🔴
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs text-muted font-medium mt-1 block">
                  {format(date, 'MMMM d, yyyy')}
                </span>
              </div>

              {/* Dynamic Slots Tracker Status */}
              <div className="mt-4">
                {isFull ? (
                  <span className="font-sans font-semibold text-muted/70 text-xs">
                    0 slots left — Booking Closed
                  </span>
                ) : isLowSlots ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 border border-warning text-warning text-xs font-bold animate-pulse-glow shadow-primary">
                    <span>⚠️</span>
                    <span>Only {slotsLeft} left!</span>
                  </div>
                ) : (
                  <span className="font-sans font-bold text-xs text-yellow">
                    {slotsLeft} slots left
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-muted text-[11px] font-sans text-left mt-2 leading-relaxed">
        * Orders close once a day reaches its cap of {maxOrdersLimit} orders to maintain supreme home-cooked quality.
      </p>
    </div>
  );
};

export default DeliveryPicker;
