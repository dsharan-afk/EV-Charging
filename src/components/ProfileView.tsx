import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentTransaction, SavedPaymentMethod } from '../types';
import {
  addPaymentMethod,
  ApiError,
  listPaymentMethods,
  NewPaymentMethod,
  removePaymentMethod,
} from '../lib/api';
import {
  User,
  Wallet,
  CreditCard,
  Plus,
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
    transactions,
    showToast,
    copyToClipboard,
    utmParams,
    logout,
    isAuthenticated,
    setActiveTab,
  } = useApp();

  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTransaction | null>(null);
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [methodType, setMethodType] = useState<'CARD' | 'UPI'>('CARD');
  const [cardBrand, setCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex' | 'RuPay'>('Visa');
  const [last4, setLast4] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState(String(new Date().getFullYear() + 1));
  const [upiId, setUpiId] = useState('');
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [removingMethodId, setRemovingMethodId] = useState<string | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);

  const downloadInvoice = (tx: PaymentTransaction) => {
    showToast(`Downloading electronic invoice ${tx.invoiceNumber} (PDF)...`, 'success');
    window.print();
  };

  useEffect(() => {
    let active = true;
    setIsLoadingMethods(true);
    listPaymentMethods()
      .then(({ items }) => {
        if (active) setUser((previous) => ({ ...previous, paymentMethods: items }));
      })
      .catch((error: unknown) => {
        if (active) {
          setPaymentMethodError(error instanceof ApiError
            ? error.message
            : 'Could not load saved payment methods.');
        }
      })
      .finally(() => {
        if (active) setIsLoadingMethods(false);
      });
    return () => { active = false; };
  }, [setUser]);

  const handleAddPaymentMethod = async (event: React.FormEvent) => {
    event.preventDefault();
    setPaymentMethodError(null);
    setIsSavingMethod(true);
    const input: NewPaymentMethod = methodType === 'CARD'
      ? {
          type: 'CARD',
          brand: cardBrand,
          last4,
          expMonth: Number(expMonth),
          expYear: Number(expYear),
        }
      : { type: 'UPI', upiId: upiId.trim() };

    try {
      const saved = await addPaymentMethod(input);
      setUser((previous) => ({
        ...previous,
        paymentMethods: [saved, ...previous.paymentMethods],
      }));
      setIsAddMethodOpen(false);
      setLast4('');
      setExpMonth('');
      setUpiId('');
      showToast(methodType === 'CARD'
        ? 'Saved demo card details. This method cannot be charged.'
        : 'Saved UPI ID as unverified. No payment was initiated.', 'success');
      try {
        const { items } = await listPaymentMethods();
        setUser((previous) => ({ ...previous, paymentMethods: items }));
      } catch {
        setPaymentMethodError('The method was saved, but the list could not be refreshed. Reopen this page to reload it.');
      }
    } catch (error) {
      setPaymentMethodError(error instanceof ApiError
        ? error.message
        : 'Could not save this payment method. Please try again.');
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleRemovePaymentMethod = async (method: SavedPaymentMethod) => {
    setPaymentMethodError(null);
    setRemovingMethodId(method.id);
    try {
      await removePaymentMethod(method.id);
      setUser((previous) => ({
        ...previous,
        paymentMethods: previous.paymentMethods.filter((item) => item.id !== method.id),
      }));
      showToast('Payment method removed.', 'success');
    } catch (error) {
      setPaymentMethodError(error instanceof ApiError
        ? error.message
        : 'Could not remove this payment method. Please try again.');
    } finally {
      setRemovingMethodId(null);
    }
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
              onClick={() => setActiveTab('home')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Go to Sign In</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800/80 text-left text-xs">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span>₹ Prepaid Wallet</span>
              </div>
              <p className="text-[11px] text-neutral-400">Wallet balances come from your account record. No bank balance is shown.</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-emerald-400" />
                <span>RFID ChargePass</span>
              </div>
              <p className="text-[11px] text-neutral-400">RFID access is unavailable until an operator provisions a tag.</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>GST Tax Invoices</span>
              </div>
              <p className="text-[11px] text-neutral-400">Only transactions recorded by a configured payment service can appear here.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Header */}
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
              {user.memberSince && <p className="text-[11px] text-neutral-500 mt-0.5">Member since {user.memberSince}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

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
            <span className="text-[11px] text-neutral-500">Top-ups unavailable</span>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-neutral-950 p-5 space-y-3">
            <span className="text-xs text-neutral-400">Available Charging Balance</span>
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
              ₹{user.walletBalance.toFixed(2)}
            </div>
            <p className="text-xs text-neutral-400">
              Persisted INR wallet balance. External bank balances and payment-provider credits are not displayed.
            </p>
          </div>

          {user.rfidTagNumber && (
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
          )}
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Saved Payment Methods</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setPaymentMethodError(null);
                setIsAddMethodOpen((open) => !open);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs hover:bg-neutral-700"
            >
              <Plus className="h-3.5 w-3.5" />
              {isAddMethodOpen ? 'Cancel' : 'Add method'}
            </button>
          </div>

          <p className="text-[11px] text-neutral-400">
            Saved cards are demo-only display details; saved UPI IDs are unverified. Neither can be charged.
          </p>

          {paymentMethodError && (
            <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
              {paymentMethodError}
            </p>
          )}

          <div className="space-y-3">
            {isLoadingMethods ? (
              <p className="text-xs text-neutral-400">Loading saved payment methods...</p>
            ) : user.paymentMethods.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-400">
                No payment methods are linked to this account.
              </p>
            ) : user.paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  {method.type === 'CARD' ? (
                    <>
                      <p className="font-semibold text-white">{method.brand} ···· {method.last4}</p>
                      <p className="text-[11px] text-neutral-500">
                        Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear} · Demo only, not chargeable
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-white">UPI · {method.upiId}</p>
                      <p className="text-[11px] text-amber-300">Saved, not bank-verified</p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  disabled={removingMethodId === method.id}
                  onClick={() => void handleRemovePaymentMethod(method)}
                  className="shrink-0 rounded-lg border border-neutral-700 px-2.5 py-1.5 text-[11px] text-rose-300 hover:bg-rose-950/40 disabled:opacity-50"
                >
                  {removingMethodId === method.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>

          {isAddMethodOpen && (
            <form onSubmit={handleAddPaymentMethod} className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <label className="block space-y-1 text-xs text-neutral-300">
                Method type
                <select
                  value={methodType}
                  onChange={(event) => setMethodType(event.target.value as 'CARD' | 'UPI')}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-white"
                >
                  <option value="CARD">Demo card details</option>
                  <option value="UPI">UPI ID</option>
                </select>
              </label>

              {methodType === 'CARD' ? (
                <>
                  <p className="text-[11px] text-amber-300">
                    Demo only: enter a brand, last four digits, and expiry for display. Do not enter a full card number, CVV, PIN, or OTP.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 text-xs text-neutral-300">
                      Brand
                      <select
                        value={cardBrand}
                        onChange={(event) => setCardBrand(event.target.value as typeof cardBrand)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-white"
                      >
                        <option>Visa</option>
                        <option>Mastercard</option>
                        <option>Amex</option>
                        <option>RuPay</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-xs text-neutral-300">
                      Last four digits
                      <input
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        value={last4}
                        onChange={(event) => setLast4(event.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-white"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-neutral-300">
                      Expiry month
                      <input
                        required
                        type="number"
                        min="1"
                        max="12"
                        value={expMonth}
                        onChange={(event) => setExpMonth(event.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-white"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-neutral-300">
                      Expiry year
                      <input
                        required
                        type="number"
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 15}
                        value={expYear}
                        onChange={(event) => setExpYear(event.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-white"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label className="block space-y-1 text-xs text-neutral-300">
                    UPI ID
                    <input
                      required
                      type="text"
                      autoComplete="off"
                      pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,255}@[A-Za-z][A-Za-z0-9.-]{1,63}"
                      value={upiId}
                      onChange={(event) => setUpiId(event.target.value)}
                      placeholder="name@bank"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-white"
                    />
                  </label>
                  <p className="text-[11px] text-neutral-400">
                    This ID will be saved as unverified. No UPI PIN or OTP is requested.
                  </p>
                </>
              )}

              <button
                type="submit"
                disabled={isSavingMethod}
                className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-neutral-950 disabled:opacity-50"
              >
                {isSavingMethod ? 'Saving...' : 'Save method'}
              </button>
            </form>
          )}
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-500">
                    No backend-recorded transactions are available.
                  </td>
                </tr>
              ) : transactions.map((tx) => (
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
