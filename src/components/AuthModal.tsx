import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, setActiveTab, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('rahul.subramanian@evcharged.in');
  const [password, setPassword] = useState('chennai2026!');
  const [name, setName] = useState('Rahul Subramanian');
  const [phone, setPhone] = useState('+91 98401 23456');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'login') {
        const res = login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
        } else {
          setSuccessMsg('Signed in successfully! Redirecting...');
          setTimeout(() => setIsAuthModalOpen(false), 500);
        }
      } else {
        const res = register(name, email, password, phone);
        if (!res.success) {
          setErrorMsg(res.error || 'Unable to register account.');
        } else {
          setSuccessMsg('Registration completed! Welcome to EV Charged.');
          setTimeout(() => setIsAuthModalOpen(false), 500);
        }
      }
    }, 400);
  };

  const handleQuickFill = (type: 'customer' | 'admin') => {
    setErrorMsg(null);
    if (type === 'customer') {
      setEmail('rahul.subramanian@evcharged.in');
      setPassword('chennai2026!');
      setName('Rahul Subramanian');
      setPhone('+91 98401 23456');
    } else {
      setEmail('admin.chennai@evcharged.in');
      setPassword('admin_secure_chennai');
      setName('Chennai Central Hub Ops Admin');
      setPhone('+91 98400 99881');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-900 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Branding */}
        <div className="text-center space-y-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto mb-2">
            <Zap className="h-6 w-6 fill-emerald-500/20" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {mode === 'login' ? 'Sign in to EV Charged' : 'Create an EV Account'}
          </h2>
          <p className="text-xs text-neutral-400">
            Access real-time superchargers, track vehicle battery, and reserve slots
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Error State */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Form Success State */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in duration-150">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className={`w-full rounded-xl bg-neutral-900 border pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  errorMsg ? 'border-rose-500/80 focus:border-rose-500' : 'border-neutral-800 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Mobile Phone (for SMS Slot Alerts)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password with Visibility Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => showToast('Password recovery link dispatched to ' + email, 'info')}
                  className="text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl bg-neutral-900 border pl-9 pr-10 py-2.5 text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  errorMsg ? 'border-rose-500/80 focus:border-rose-500' : 'border-neutral-800 focus:border-emerald-500'
                }`}
              />
              {/* Password visibility toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                <span>Authenticating with Spring Security...</span>
              </span>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create EV Charged Account'}</span>
            )}
          </button>
        </form>



        {/* Quick Demo Credentials */}
        <div className="pt-3 border-t border-neutral-800/80 space-y-2">
          <p className="text-[11px] text-neutral-500 text-center">Quick Demo Presets:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('customer')}
              className="py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors text-center"
            >
              Fill Rahul (Chennai Driver)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors text-center"
            >
              Fill Station Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
