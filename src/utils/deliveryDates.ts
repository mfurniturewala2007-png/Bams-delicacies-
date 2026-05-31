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
