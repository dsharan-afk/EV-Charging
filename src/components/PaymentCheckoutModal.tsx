import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CreditCard,
  Wallet,
  Zap,
  CheckCircle2,
  X,
  ShieldCheck,
  Radio,
  Receipt,
  Download,
} from 'lucide-react';

export const PaymentCheckoutModal: React.FC = () => {
  const {
    pendingPaymentSession,
    clearPendingPayment,
    processPayment,
    user,
    showToast,
  } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<'WALLET' | 'CARD' | 'APPLE_PAY' | 'RFID'>('WALLET');
  const [isSuccess, setIsSuccess] = useState(false);
  const [paidTxId, setPaidTxId] = useState('');

  if (!pendingPaymentSession) return null;

  const totalAmount = pendingPaymentSession.costAccrued;
  const isWalletSufficient = user.walletBalance >= totalAmount;

  const handlePay = () => {
    if (selectedMethod === 'WALLET' && !isWalletSufficient) {
      showToast('Insufficient wallet balance. Please select credit card or top up your wallet.', 'error');
      return;
    }

    const ok = processPayment(selectedMethod);
    if (ok) {
      setIsSuccess(true);
      setPaidTxId(`INV-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleDone = () => {
    setIsSuccess(false);
    clearPendingPayment();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">Settle Charging Session</h2>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {pendingPaymentSession.stationName} · Stall #{pendingPaymentSession.portNumber}
                </p>
              </div>

              <button
                onClick={clearPendingPayment}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Itemized Session Invoice */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Vehicle:</span>
                <span className="font-semibold text-white">{pendingPaymentSession.vehicleName}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Energy Consumed:</span>
                <span className="font-mono text-white tabular-nums font-semibold">
                  {pendingPaymentSession.energyDeliveredKwh} kWh
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Station Rate:</span>
                <span className="font-mono text-white tabular-nums">
                  ₹{pendingPaymentSession.ratePerKwh.toFixed(2)} / kWh
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Grid Access & Connector Fee:</span>
                <span className="font-mono text-emerald-400 font-semibold">WAIVED</span>
              </div>

              <div className="pt-2.5 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total Charge Due:</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
                  ₹{totalAmount.toFixed(2)} INR
                </span>
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">Select Payment Channel</span>

              <div className="space-y-2">
                {/* Method 1: EV Charged Wallet */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('WALLET')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'WALLET'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">EV Charged Prepaid Wallet</p>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Balance: ₹{user.walletBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {!isWalletSufficient && (
                    <span className="text-[10px] text-rose-400 font-medium">Low Balance</span>
                  )}
                </button>

                {/* Method 2: Primary Card / UPI */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'CARD'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-white">UPI / RuPay / Visa (ending 4242)</p>
                      <p className="text-[11px] text-neutral-400">GPay, PhonePe, Paytm, or Card</p>
                    </div>
                  </div>
                </button>

                {/* Method 3: Mobile Contactless */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('APPLE_PAY')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'APPLE_PAY'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-neutral-200" />
                    <div>
                      <p className="text-xs font-bold text-white">Google Pay / Apple Pay / NFC</p>
                      <p className="text-[11px] text-neutral-400">Device Biometric Auth</p>
                    </div>
                  </div>
                </button>

                {/* Method 4: RFID Tap */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('RFID')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedMethod === 'RFID'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Radio className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">RFID ChargePass Tap</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{user.rfidTagNumber}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Pay Button */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <button
                onClick={handlePay}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-neutral-950 font-extrabold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Authorize & Pay ₹{totalAmount.toFixed(2)}</span>
              </button>
              <p className="text-[10px] text-neutral-500 text-center">
                Encrypted via 256-bit TLS · Compliant with RBI & PCI-DSS Level 1 Standards
              </p>
            </div>
          </>
        ) : (
          /* Payment Success Confirmation */
          <div className="text-center py-4 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Payment Successful</h2>
              <p className="text-xs text-neutral-400 mt-1 font-mono">Invoice Reference: {paidTxId}</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-400 font-mono">₹{totalAmount.toFixed(2)} INR</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Payment Method:</span>
                <span className="font-mono text-white">{selectedMethod}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Clean Energy Delivered:</span>
                <span className="font-mono text-white">{pendingPaymentSession.energyDeliveredKwh} kWh</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => showToast(`Receipt ${paidTxId} downloaded successfully`, 'success')}
                className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Tax Receipt</span>
              </button>
              <button
                onClick={handleDone}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
