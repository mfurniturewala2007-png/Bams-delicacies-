// api/notify-telegram.ts — Vercel Serverless Function
// ES module syntax only. No require().

interface OrderItem {
  name: string;
  dozens: number;
}

interface NotifyBody {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  delivery_date: string;
  items: OrderItem[];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    order_id,
    customer_name,
    customer_phone,
    total,
    delivery_date,
    items,
  } = req.body as NotifyBody;

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
    return res.status(500).json({ error: 'Telegram env vars not configured' });
  }

  // Helper to escape HTML special characters
  const escapeHtml = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const safeName = escapeHtml(customer_name);
  const safePhone = escapeHtml(customer_phone);
  const safeDate = escapeHtml(delivery_date);
  const safeOrderId = escapeHtml(order_id);

  const itemLines = (items ?? [])
    .map((item) => `  • ${escapeHtml(item.name)} × ${item.dozens} doz`)
    .join('\n');

  const message = [
    `🛒 <b>New Order!</b>`,
    `👤 ${safeName}`,
    `📞 ${safePhone}`,
    `📅 ${safeDate}`,
    ``,
    `<b>Items:</b>`,
    itemLines,
    ``,
    `💰 ₹${total}`,
    `🆔 <code>${safeOrderId}</code>`,
  ].join('\n');

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!telegramRes.ok) {
      const errorText = await telegramRes.text();
      console.error('Telegram API error:', errorText);
      return res.status(500).json({ error: 'Telegram API error', detail: errorText });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Failed to send Telegram message:', err);
    return res.status(500).json({ error: err.message ?? 'Unknown error' });
  }
}
