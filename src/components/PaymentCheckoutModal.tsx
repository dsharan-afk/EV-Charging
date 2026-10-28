import React from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, X } from 'lucide-react';

export const PaymentCheckoutModal: React.FC = () => {
  const { pendingPaymentSession, clearPendingPayment } = useApp();

  if (!pendingPaymentSession) return null;

  const totalAmount = pendingPaymentSession.costAccrued;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Session Cost Estimate</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {pendingPaymentSession.stationName} · Stall #{pendingPaymentSession.portNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={clearPendingPayment}
            aria-label="Close session estimate"
            className="text-neutral-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Vehicle:</span>
            <span className="font-semibold text-white">{pendingPaymentSession.vehicleName}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Energy consumed (simulated):</span>
            <span className="font-mono text-white">{pendingPaymentSession.energyDeliveredKwh} kWh</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Rate:</span>
            <span className="font-mono text-white">₹{pendingPaymentSession.ratePerKwh.toFixed(2)} / kWh</span>
          </div>
          <div className="pt-2.5 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Estimated cost:</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              ₹{totalAmount.toFixed(2)} INR
            </span>
          </div>
        </div>

        <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-200">
          Payment processing is not configured. This session is simulated; no payment, wallet debit, or invoice has been created.
        </div>

        <button
          type="button"
          onClick={clearPendingPayment}
          className="w-full py-3 rounded-xl bg-neutral-800 text-white font-semibold text-xs hover:bg-neutral-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};
