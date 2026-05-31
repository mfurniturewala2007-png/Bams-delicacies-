import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

// ─── FILL IN YOUR UPI ID BELOW ───────────────────────────────────────────────
const UPI_ID = 'bamsdelicacies@upi'; // Mohammed: replace with your real UPI ID
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  orderId: string;
  totalAmount: number;
  onConfirmed: () => void;
  onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  totalAmount,
  onConfirmed,
  onCancel,
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [txnError, setTxnError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Copy UPI ID to clipboard
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // "I've Paid ✓" — validate txn ID, update order to pending + save txn ID
  const handleConfirmPayment = async () => {
    const trimmed = transactionId.trim();
    if (!trimmed) {
      setTxnError('Transaction ID is required.');
      return;
    }
    if (trimmed.length < 8) {
      setTxnError('Transaction ID must be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setTxnError('');

      const { error } = await supabase
        .from('orders')
        .update({ status: 'pending', upi_transaction_id: trimmed })
        .eq('id', orderId);

      if (error) throw error;

      onConfirmed();
    } catch (err: any) {
      console.error('Failed to confirm payment:', err);
      setTxnError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // "Cancel Order" — update order status to cancelled, close modal
  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);

      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      onCancel();
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      // Still close modal even if DB update fails — admin can reconcile
      onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay — non-dismissible to prevent accidental close */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl animate-fade-slide-up overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-8 pb-4 text-center border-b border-border/40">
          <h2 className="font-serif font-black text-2xl text-heading">Complete Payment</h2>
          <p className="font-sans text-sm text-muted mt-1">
            Pay <span className="text-yellow font-bold font-serif">₹{totalAmount}</span> to confirm your order
          </p>
        </div>

        <div className="px-6 py-6 space-y-5">

          {/* ── QR Code ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-border/30 inline-block">
              <img
                src="/upi-qr.png"
                alt="UPI QR Code"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  // Fallback placeholder if QR image is missing
                  (e.target as HTMLImageElement).style.display = 'none';
                  const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (next) next.style.display = 'flex';
                }}
              />
              {/* Placeholder shown if upi-qr.png is missing */}
              <div
                className="w-48 h-48 hidden flex-col items-center justify-center gap-2 text-muted"
                style={{ display: 'none' }}
              >
                <span className="text-4xl">📷</span>
                <span className="text-xs font-sans text-center">
                  Add your QR image at<br /><code className="text-primary">public/upi-qr.png</code>
                </span>
              </div>
            </div>

            {/* Yellow pill */}
            <span className="bg-yellow text-bg text-xs font-sans font-bold px-4 py-1.5 rounded-full shadow-yellow">
              Scan &amp; pay using any UPI app
            </span>
          </div>

          {/* ── UPI ID + Copy ── */}
          <div className="flex items-center justify-between bg-surface-2 border border-border rounded-xl px-4 py-3 gap-3">
            <div className="text-left min-w-0">
              <p className="text-[10px] font-sans font-bold text-muted uppercase tracking-wider mb-0.5">UPI ID</p>
              <p className="font-mono text-sm text-text truncate">{UPI_ID}</p>
            </div>
            <button
              onClick={handleCopyUpiId}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-sans font-bold uppercase tracking-wider transition-all duration-200 hover:border-yellow hover:text-yellow"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-grow h-px bg-border/60" />
            <span className="text-muted text-[11px] font-sans uppercase tracking-widest">After paying</span>
            <div className="flex-grow h-px bg-border/60" />
          </div>

          {/* ── Transaction ID input ── */}
          <div>
            <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
              Enter UPI Transaction ID <span className="text-error">*</span>
            </label>
            <p className="text-muted text-xs font-sans mb-2">
              Paste the transaction ID from your payment app (e.g. Google Pay, PhonePe, Paytm)
            </p>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value);
                if (txnError) setTxnError('');
              }}
              placeholder="e.g. 412345678901"
              className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-mono placeholder:text-muted/40 focus:outline-none focus:border-yellow focus:ring-2 focus:ring-yellow/20 transition-all duration-200 ${
                txnError ? 'border-error' : 'border-border'
              }`}
            />
            {txnError && (
              <span className="text-error text-xs font-sans font-semibold mt-1.5 block">
                ⚠️ {txnError}
              </span>
            )}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 pt-1">
            {/* Cancel Order */}
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling || isSubmitting}
              className="flex-1 py-3 rounded-xl border-2 border-error/60 text-error font-sans font-bold text-sm uppercase tracking-wider hover:bg-error/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>

            {/* I've Paid */}
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting || isCancelling}
              className="flex-[2] py-3 rounded-xl bg-yellow text-bg font-sans font-black text-sm uppercase tracking-wider hover:bg-yellow-dim hover:scale-[1.02] shadow-yellow active:scale-98 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Confirming...' : "I've Paid ✓"}
            </button>
          </div>

          <p className="text-muted text-[10px] font-sans text-center leading-relaxed">
            Your order will be confirmed after the admin verifies your payment. You'll receive updates via WhatsApp or phone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
