import React from 'react';
import { format } from 'date-fns';
import { getNext7DeliveryDays } from '../utils/deliveryDates';

interface DeliveryPickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  orders: { delivery_date: string }[];
  maxOrdersLimit?: number;
}

const DeliveryPicker: React.FC<DeliveryPickerProps> = ({
  selectedDate,
  onSelect,
  orders,
  maxOrdersLimit = 15,
}) => {
  const deliveryDays = React.useMemo(() => getNext7DeliveryDays(), []);
  const selectedStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  return (
    <div className="w-full">
      <label className="block text-left text-sm font-sans font-semibold text-text uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Select Delivery Date <span className="text-primary">*</span></span>
        {!selectedDate && (
          <span className="text-[10px] text-yellow font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span>⚠️</span>
            <span>Please Select A Slot</span>
          </span>
        )}
      </label>

      {/* 7-Day Picker Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {deliveryDays.map(({ date, isWeekend }) => {
          const cardStr = format(date, 'yyyy-MM-dd');
          const isSelected = cardStr === selectedStr;
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
              className={`relative p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-300 select-none flex flex-col items-center justify-between ${
                isFull
                  ? 'bg-surface border-border opacity-50 cursor-not-allowed pointer-events-none'
                  : isSelected
                  ? 'bg-surface-2 border-primary shadow-primary text-text'
                  : isWeekend
                  ? 'bg-yellow/5 border-yellow/40 hover:border-yellow/70 text-text/90'
                  : 'bg-surface border-border hover:border-primary/50 text-text/80'
              }`}
              style={{
                boxShadow:
                  isWeekend && !isFull && !isSelected
                    ? '0 0 10px rgba(245, 194, 0, 0.18)'
                    : undefined,
              }}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black bg-primary text-white shadow-sm">
                  ✓
                </span>
              )}

              {/* Day abbreviation */}
              <span
                className={`font-sans font-extrabold text-[11px] tracking-tight ${
                  isFull ? 'text-muted/40' : isWeekend ? 'text-yellow-dim' : 'text-muted'
                }`}
              >
                {format(date, 'EEE')}
              </span>

              {/* Date number */}
              <span className="font-sans font-black text-lg leading-tight mt-0.5 text-text">
                {format(date, 'd')}
              </span>

              {/* Month */}
              <span className="font-sans text-[10px] text-muted font-medium">
                {format(date, 'MMM')}
              </span>

              {/* Preferred badge for weekends */}
              {isWeekend && !isFull && !isSelected && (
                <span className="mt-1 text-[7px] font-black px-1 py-0.5 rounded-full uppercase tracking-wider bg-yellow/20 text-yellow-dim border border-yellow/30">
                  Preferred
                </span>
              )}

              {/* Status */}
              {isFull ? (
                <span className="mt-1 font-sans font-semibold text-muted/70 text-[9px]">
                  Full
                </span>
              ) : isLowSlots ? (
                <div className="mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-warning/15 border border-warning text-warning text-[8px] font-bold animate-pulse-glow">
                  <span>⚠️</span>
                  <span>{slotsLeft} left</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryPicker;
