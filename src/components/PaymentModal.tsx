import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../utils/supabase';

// ─── FILL IN YOUR DETAILS BELOW ──────────────────────────────────────────────
const UPI_ID   = 'bamsdelicacies@upi';  // Mohammed: replace with your real UPI ID
const UPI_NAME = "Bam's Delicacies";    // Display name shown in UPI apps
// ─────────────────────────────────────────────────────────────────────────────

/** Builds the UPI deep link — amount pre-filled, opens GPay / PhonePe / Paytm */
const buildUPILink = (amount: number): string =>
  `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount.toFixed(2)}&cu=INR`;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transactionId, setTransactionId] = useState('');
  const [txnError, setTxnError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Generate QR code onto canvas whenever totalAmount changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const upiLink = buildUPILink(totalAmount);
    QRCode.toCanvas(canvasRef.current, upiLink, {
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).catch((err) => {
      console.error('QR generation failed:', err);
      setQrError(true);
    });
  }, [totalAmount]);

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

      {/* Modal card — max-width 420px per spec */}
      <div
        className="relative z-10 w-full bg-surface border border-border rounded-2xl shadow-2xl animate-fade-slide-up overflow-y-auto"
        style={{ maxWidth: '420px', maxHeight: '95vh' }}
      >

        {/* ── Header ── */}
        <div className="px-6 pt-7 pb-4 text-center border-b border-border/40">
          <h2 className="font-serif font-black text-[22px] text-heading leading-tight">
            Pay to Confirm Order
          </h2>
          <p className="font-sans text-sm mt-1" style={{ color: '#999999' }}>
            Scan with any UPI app
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* ── QR Canvas ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg inline-flex items-center justify-center">
              {qrError ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 text-gray-500"
                  style={{ width: 220, height: 220 }}
                >
                  <span className="text-3xl">⚠️</span>
                  <span className="text-xs text-center font-sans">
                    QR failed to generate.<br />Use UPI ID below to pay.
                  </span>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  style={{ borderRadius: '12px', display: 'block' }}
                />
              )}
            </div>

            {/* Amount pill — Playfair Display, yellow, bold */}
            <span
              className="font-serif font-bold rounded-full shadow-yellow px-5 py-1.5"
              style={{
                backgroundColor: '#F5C200',
                color: '#1E1E1E',
                fontSize: '20px',
              }}
            >
              ₹{totalAmount}
            </span>

            {/* App hint */}
            <p className="text-xs font-sans" style={{ color: '#999999' }}>
              GPay · PhonePe · Paytm · any UPI app
            </p>
          </div>

          {/* ── UPI ID + Copy ── */}
          <div className="flex items-center justify-between bg-surface-2 border border-border rounded-xl px-4 py-3 gap-3">
            <div className="text-left min-w-0">
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider mb-0.5" style={{ color: '#999999' }}>
                UPI ID:
              </p>
              <p className="font-mono text-sm text-text truncate">{UPI_ID}</p>
            </div>
            <button
              onClick={handleCopyUpiId}
              title="Copy UPI ID"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-sans font-bold uppercase tracking-wider transition-all duration-200 hover:border-yellow hover:text-yellow"
            >
              {copied ? (
                <span className="text-success">✓ Copied!</span>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-grow h-px bg-border/60" />
            <span className="text-[11px] font-sans uppercase tracking-widest" style={{ color: '#999999' }}>
              After paying
            </span>
            <div className="flex-grow h-px bg-border/60" />
          </div>

          {/* ── Transaction ID input ── */}
          <div>
            <label className="block text-[11px] font-sans font-bold text-text/80 uppercase tracking-wider mb-1.5">
              Enter UPI Transaction ID after paying <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value);
                if (txnError) setTxnError('');
              }}
              placeholder="e.g. 407291836472"
              className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-text font-mono placeholder:text-muted/40 focus:outline-none focus:border-yellow focus:ring-2 transition-all duration-200 ${
                txnError ? 'border-error' : 'border-border'
              }`}
              style={{ focusRingColor: 'rgba(245,194,0,0.2)' } as React.CSSProperties}
            />
            <p className="text-xs font-sans mt-1.5" style={{ color: '#999999' }}>
              Find it in your UPI app under transaction history
            </p>
            {txnError && (
              <span className="text-error text-xs font-sans font-semibold mt-1 block">
                ⚠️ {txnError}
              </span>
            )}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 pt-1 pb-2">
            {/* Cancel — red text button, left */}
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling || isSubmitting}
              className="flex-shrink-0 py-3 px-4 font-sans font-bold text-sm text-error hover:underline transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </button>

            {/* I've Paid — yellow, full width, rounded-full */}
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting || isCancelling}
              className="flex-1 py-3 rounded-full font-sans font-black text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#F5C200',
                color: '#1E1E1E',
                boxShadow: '0 0 20px rgba(245,194,0,0.2)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C49A00';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F5C200';
              }}
            >
              {isSubmitting ? 'Confirming...' : "I've Paid ✓"}
            </button>
          </div>

          <p className="text-[10px] font-sans text-center leading-relaxed pb-1" style={{ color: '#999999' }}>
            Your order will be confirmed after the admin verifies your payment. You'll receive updates via WhatsApp or phone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
