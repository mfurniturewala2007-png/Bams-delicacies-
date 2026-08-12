import { addDays, getDay } from 'date-fns';

export const MAX_ORDERS_PER_DAY = 15;

function getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
  const result = new Date(date);
  const currentDay = getDay(result);
  const daysToAdd = (dayOfWeek - currentDay + 7) % 7 || 7;
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/** Legacy helper — still used by Admin and Hero components */
export function getAvailableDeliveryDates(): { saturday: Date; sunday: Date } {
  const today = new Date();
  const dayOfWeek = getDay(today); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  // Fri (5), Sat (6), Sun (0) → use NEXT week's Sat/Sun
  // Mon (1) through Thu (4) → use THIS week's Sat/Sun
  const useNextWeek = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  let saturday = getNextDayOfWeek(today, 6); // 6 = Saturday
  let sunday = getNextDayOfWeek(today, 0);   // 0 = Sunday

  if (useNextWeek) {
    saturday = addDays(saturday, 7);
    sunday = addDays(sunday, 7);
  }

  return { saturday, sunday };
}

/**
 * Returns the next 7 delivery days starting from tomorrow.
 * Saturday (day 6) and Sunday (day 0) are marked as "preferred".
 */
export function getNext7DeliveryDays(): { date: Date; isWeekend: boolean }[] {
  const days: { date: Date; isWeekend: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    const dow = getDay(date); // 0=Sun, 6=Sat
    days.push({ date, isWeekend: dow === 0 || dow === 6 });
  }

  return days;
}

export function getSlotsLeft(date: Date, orders: { delivery_date: string }[]): number {
  const dateStr = date.toISOString().split('T')[0];
  const count = orders.filter(o => o.delivery_date === dateStr).length;
  return Math.max(0, MAX_ORDERS_PER_DAY - count);
}
