import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentTransaction } from '../types';
import {
  User,
  Wallet,
  CreditCard,
  Plus,
  ShieldCheck,
  CheckCircle,
  FileText,
  Download,
  Leaf,
  Zap,
  Radio,
  X,
  Copy,
  Printer,
  Compass,
  Link2,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    user,
    setUser,
    toggleUserRole,
    addFundsToWallet,
    transactions,
    showToast,
    copyToClipboard,
    utmParams,
    logout,
    isAuthenticated,
    setActiveTab,
    login,
  } = useApp();

  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTransaction | null>(null);

  const handleTopUpConfirm = () => {
    if (topUpAmount <= 0) return;
    addFundsToWallet(topUpAmount);
    setIsTopUpOpen(false);
  };

  const downloadInvoice = (tx: PaymentTransaction) => {
    showToast(`Downloading electronic invoice ${tx.invoiceNumber} (PDF)...`, 'success');
    window.print();
  };

  const handleQuickDemoLogin = () => {
    login('rahul.subramanian@evcharged.in', 'chennai2026!');
    showToast('Signed in as Rahul Subramanian (Chennai Driver)', 'success');
  };

  // If not authenticated, display dedicated User Page invitation with link to separate login page
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8 pb-16">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-12 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xl shadow-emerald-500/10">
            <User className="h-8 w-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
              User Account & Profile Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign In to View Your EV Charged User Page
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              You are currently viewing as a guest. Please visit our dedicated User Login Page to authenticate your EV driver account, manage your ₹ (INR) wallet, track real-time charging sessions across Indian expressways, and download tax receipts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={logout}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Sign In with Account</span>
            </button>

            <button
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>Quick Demo Sign-In (Rahul · Chennai)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800/80 text-left text-xs">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span>₹ Prepaid Wallet</span>
              </div>
              <p className="text-[11px] text-neutral-400">Instant UPI & card top-ups with zero transaction convenience charges.</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-emerald-400" />
                <span>RFID ChargePass</span>
              </div>
              <p className="text-[11px] text-neutral-400">Virtual RFID token for seamless contactless tap-and-charge at 26 Indian hubs.</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>GST Tax Invoices</span>
              </div>
              <p className="text-[11px] text-neutral-400">Download printable and official PDF receipts for commercial and personal tax claims.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Header & Role Mode */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-bold text-xl shadow-lg shadow-emerald-500/20">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  user.role === 'ADMIN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{user.email} · {user.phone}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Member since {user.memberSince}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={toggleUserRole}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{user.role === 'CUSTOMER' ? 'Operator Mode' : 'Customer Mode'}</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-rose-400 text-xs font-semibold hover:bg-rose-950/40 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Feature 14: UTM Acquisition Attribution (if present) */}
      {Object.keys(utmParams).length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 text-neutral-400 font-semibold">
            <Link2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Campaign Tracking & Attribution (UTM Active)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300 pt-1">
            {utmParams.source && <span className="bg-neutral-800 px-2 py-0.5 rounded">source: {utmParams.source}</span>}
            {utmParams.medium && <span className="bg-neutral-800 px-2 py-0.5 rounded">medium: {utmParams.medium}</span>}
            {utmParams.campaign && <span className="bg-neutral-800 px-2 py-0.5 rounded">campaign: {utmParams.campaign}</span>}
          </div>
        </div>
      )}

      {/* Wallet & Payment Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: EV Charged Wallet & RFID */}
        <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">EV Charged Prepaid Wallet</h2>
            </div>
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Funds</span>
            </button>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-neutral-950 p-5 space-y-3">
            <span className="text-xs text-neutral-400">Available Charging Balance</span>
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
              ₹{user.walletBalance.toFixed(2)}
            </div>
            <p className="text-xs text-emerald-400">
              One-tap authorization enabled across all partner ultra-fast stalls
            </p>
          </div>

          {/* Virtual RFID Card with Copy Button */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">RFID Smart ChargePass</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-400">{user.rfidTagNumber}</span>
                  <button
                    onClick={() => copyToClipboard(user.rfidTagNumber, 'RFID Tag')}
                    className="p-0.5 text-neutral-500 hover:text-white"
                    title="Copy Tag"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Active NFC
            </span>
          </div>
        </div>

        {/* Right: Saved Cards & Payment Options */}
        <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Saved Payment Methods</h2>
            </div>
            <span className="text-xs text-neutral-400">Instant Checkout</span>
          </div>

          <div className="space-y-3">
            {user.savedCards.map((card) => (
              <div
                key={card.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-12 rounded bg-neutral-800 flex items-center justify-center font-bold text-[11px] text-white">
                    {card.brand}
                  </div>
                  <div>
                    <p className="font-semibold text-white">•••• •••• •••• {card.last4}</p>
                    <p className="text-[11px] text-neutral-500">Expires {card.expMonth}/{card.expYear}</p>
                  </div>
                </div>

                {card.isDefault && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Default
                  </span>
                )}
              </div>
            ))}

            <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-3 text-center">
              <button
                onClick={() => showToast('Apple Pay & Google Pay are automatically enabled on this device.', 'info')}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                + Link Apple Pay / Google Pay / Corporate Fleet Card
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Sustainability Impact */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Environmental Impact & Clean Energy Metrics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <span className="text-xs text-neutral-400 block">Total Energy Delivered</span>
            <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {user.totalKwhCharged.toFixed(1)} kWh
            </span>
            <span className="text-[11px] text-emerald-400 block mt-1">100% Certified Renewable</span>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <span className="text-xs text-neutral-400 block">Net CO₂ Avoided</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {user.totalCo2SavedKg.toFixed(1)} kg
            </span>
            <span className="text-[11px] text-neutral-400 block mt-1">vs internal combustion</span>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <span className="text-xs text-neutral-400 block">Equivalent Trees Saved</span>
            <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {Math.round(user.totalCo2SavedKg / 21.7)} Trees
            </span>
            <span className="text-[11px] text-emerald-400 block mt-1">Global reforestation</span>
          </div>
        </div>
      </div>

      {/* Transaction History & Electronic Receipts */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Billing History & Electronic Invoices</h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">{transactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                <th className="pb-3 pl-2">Invoice #</th>
                <th className="pb-3">Session Description</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Method</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3 pl-2 font-mono font-medium text-white flex items-center gap-1.5">
                    <span>{tx.invoiceNumber}</span>
                    <button
                      onClick={() => copyToClipboard(tx.invoiceNumber, 'Invoice Number')}
                      className="text-neutral-500 hover:text-white"
                      title="Copy Invoice #"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="py-3 text-neutral-300 max-w-xs truncate">{tx.description}</td>
                  <td className="py-3 text-neutral-400 font-mono">{tx.timestamp}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                    ₹{tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => setSelectedInvoice(tx)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Top Up EV Charged Wallet</h3>
              </div>
              <button onClick={() => setIsTopUpOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-400">Select deposit amount:</p>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                      topUpAmount === amt
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400'
                        : 'bg-neutral-900 border-neutral-800 text-white hover:border-neutral-700'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs text-neutral-400 block mb-1">Custom Amount (₹):</label>
                <input
                  type="number"
                  min="100"
                  max="50000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 p-2.5 text-xs text-white font-mono"
                />
              </div>

              <p className="text-[11px] text-neutral-500">
                Processed via UPI / NetBanking or default card Visa ending in 4242.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUpConfirm}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
              >
                Deposit ₹{topUpAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal (Print-ready) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4 print-card">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white no-print"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-2 border-b border-neutral-800">
              <h3 className="font-bold text-white text-lg">Electronic Tax Invoice</h3>
              <p className="text-xs font-mono text-emerald-400 mt-0.5">{selectedInvoice.invoiceNumber}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Date & Time:</span>
                <span className="text-white font-mono">{selectedInvoice.timestamp}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Description:</span>
                <span className="text-white text-right max-w-[200px]">{selectedInvoice.description}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Payment Method:</span>
                <span className="text-white font-mono">{selectedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Energy Transferred:</span>
                <span className="text-white font-mono">{selectedInvoice.breakdown.energyKwh} kWh</span>
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Energy Base Charge:</span>
                  <span className="font-mono text-white">₹{selectedInvoice.breakdown.energyCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Service & Grid Fees:</span>
                  <span className="font-mono text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-neutral-800">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-400">₹{selectedInvoice.amount.toFixed(2)} INR</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2 no-print">
              <button
                onClick={() => downloadInvoice(selectedInvoice)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Invoice (PDF)</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
