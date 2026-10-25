import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Car,
} from 'lucide-react';

export const LoginPageView: React.FC = () => {
  const { login, register, setUser, setActiveTab, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  // Unified identifier: Email or Phone Number
  const [identifier, setIdentifier] = useState('rahul.subramanian@evcharged.in');
  const [password, setPassword] = useState('chennai2026!');
  
  // Registration fields
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [vehicleMake, setVehicleMake] = useState('Tata');
  const [vehicleModel, setVehicleModel] = useState('Nexon.ev Empowered+');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = login(identifier, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your email or phone number and password.');
      } else {
        setSuccessMsg(`Login successful! Entering Pan-India Station Network...`);
        showToast('Login successful! Redirecting to All-India Charging Stations...', 'success');
        setTimeout(() => setActiveTab('stations'), 400);
      }
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = register(name, regEmail, regPassword, regPhone);
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed. Please check the entered fields.');
      } else {
        setSuccessMsg(`Account created! ₹100 welcome credit added to your wallet, ${name}.`);
        showToast('Account created! Welcome to EV Charged.', 'success');
        setTimeout(() => setActiveTab('stations'), 600);
      }
    }, 450);
  };

  // Instant demo profiles
  const handleQuickDemo = (profile: 'rahul' | 'priya' | 'vikram' | 'amit' | 'admin') => {
    setErrorMsg(null);
    if (profile === 'rahul') {
      setIdentifier('rahul.subramanian@evcharged.in');
      setPassword('chennai2026!');
      setUser((prev) => ({
        ...prev,
        name: 'Rahul Subramanian',
        email: 'rahul.subramanian@evcharged.in',
        phone: '+91 98401 23456',
        role: 'CUSTOMER',
        walletBalance: 2450.0,
      }));
      showToast('Loaded demo: Rahul Subramanian (Chennai, Tamil Nadu)', 'info');
      login('rahul.subramanian@evcharged.in', 'chennai2026!');
      setActiveTab('stations');
    } else if (profile === 'priya') {
      setIdentifier('9880188776');
      setPassword('bengaluru2026');
      setUser((prev) => ({
        ...prev,
        name: 'Priya Nair',
        email: 'priya.nair@evcharged.in',
        phone: '+91 98801 88776',
        role: 'CUSTOMER',
        walletBalance: 1820.0,
      }));
      showToast('Loaded demo: Priya Nair (Bengaluru, Karnataka)', 'info');
      login('9880188776', 'bengaluru2026');
      setActiveTab('stations');
    } else if (profile === 'vikram') {
      setIdentifier('vikram.singh@evcharged.in');
      setPassword('delhincr2026');
      setUser((prev) => ({
        ...prev,
        name: 'Vikram Singh',
        email: 'vikram.singh@evcharged.in',
        phone: '+91 98110 55443',
        role: 'CUSTOMER',
        walletBalance: 3200.0,
      }));
      showToast('Loaded demo: Vikram Singh (Delhi NCR Fleet)', 'info');
      login('vikram.singh@evcharged.in', 'delhincr2026');
      setActiveTab('stations');
    } else if (profile === 'amit') {
      setIdentifier('9825012345');
      setPassword('gujarat2026');
      setUser((prev) => ({
        ...prev,
        name: 'Amit Patel',
        email: 'amit.patel@evcharged.in',
        phone: '+91 98250 12345',
        role: 'CUSTOMER',
        walletBalance: 1500.0,
      }));
      showToast('Loaded demo: Amit Patel (Ahmedabad, Gujarat)', 'info');
      login('9825012345', 'gujarat2026');
      setActiveTab('stations');
    } else {
      setIdentifier('admin@evcharged.in');
      setPassword('admin_secure');
      setUser((prev) => ({
        ...prev,
        name: 'National Grid Station Ops Admin',
        email: 'admin@evcharged.in',
        phone: '+91 98400 99881',
        role: 'ADMIN',
        walletBalance: 10000.0,
      }));
      showToast('Loaded demo: National Grid Station Ops Admin', 'info');
      login('admin@evcharged.in', 'admin_secure');
      setActiveTab('stations');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-neutral-950">
      <div className="w-full max-w-md space-y-6">
        {/* Branding & Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xl shadow-emerald-500/10 mb-1">
            <Zap className="h-8 w-8 fill-emerald-500/30 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            EV <span className="text-emerald-400">Charged</span> India
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xs mx-auto">
            Pan-India Electric Vehicle Power Station & Expressway Network
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-5">
          {/* Sign In vs Register Tab Switcher */}
          <div className="flex p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'signin'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'register'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: Basic Sign In (Email or Phone Number + Password) */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              {/* Email or Phone Number Input */}
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold flex items-center justify-between">
                  <span>Email or Mobile Number</span>
                  <span className="text-[11px] text-neutral-500 font-normal">India (+91)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-500 pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter email or 10-digit mobile number"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  e.g. <span className="text-neutral-400 font-mono">rahul.subramanian@evcharged.in</span> or <span className="text-neutral-400 font-mono">9840123456</span>
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => showToast('Password reset link sent to your registered contact.', 'info')}
                    className="text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-10 pr-11 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me option */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <span>Remember my login</span>
                </label>
                <span className="text-[10px] text-neutral-500">Secured via Bharat EV Protocol</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to EV Charged</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode 2: Create Account / Registration */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Subramanian"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. rahul@domain.in"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold">Mobile Number (+91)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">EV Make</label>
                  <select
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tata">Tata EV</option>
                    <option value="Mahindra">Mahindra Electric</option>
                    <option value="MG">MG Motor India</option>
                    <option value="Hyundai">Hyundai EV</option>
                    <option value="BYD">BYD India</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">EV Model</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Nexon.ev"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-10 pr-11 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Special Offer: Get <strong className="text-white">₹100 Free Charging Credit</strong> upon registration!</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <span>Register & Enter Network</span>
              </button>
            </form>
          )}

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-neutral-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Quick 1-Click Demo Profiles:</span>
              </span>
              <span className="text-neutral-500">Auto-signs in</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('rahul')}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 text-left transition-all group"
              >
                <div className="font-semibold text-white group-hover:text-emerald-400 text-xs">Rahul (Tamil Nadu)</div>
                <div className="text-[10px] text-neutral-400">Tata Nexon · Chennai</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('priya')}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 text-left transition-all group"
              >
                <div className="font-semibold text-white group-hover:text-emerald-400 text-xs">Priya (Karnataka)</div>
                <div className="text-[10px] text-neutral-400">MG ZS EV · Bengaluru</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('vikram')}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 text-left transition-all group"
              >
                <div className="font-semibold text-white group-hover:text-emerald-400 text-xs">Vikram (Delhi NCR)</div>
                <div className="text-[10px] text-neutral-400">Commercial Fleet Driver</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('amit')}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 text-left transition-all group"
              >
                <div className="font-semibold text-white group-hover:text-emerald-400 text-xs">Amit (Gujarat)</div>
                <div className="text-[10px] text-neutral-400">BYD Atto 3 · Ahmedabad</div>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-amber-400 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Station Operator / Admin Demo Mode</span>
              </button>
            </div>
          </div>

          {/* Guest Quick Browse Option */}
          <div className="pt-3 border-t border-neutral-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                login('guest@evcharged.in', 'guest123');
                setActiveTab('stations');
                showToast('Browsing Pan-India stations as Guest.', 'info');
              }}
              className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Explore All-India Power Stations as Guest</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Pan-India Footnote */}
        <div className="text-center text-[11px] text-neutral-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Pan-India EV Grid Coverage across 17+ States & Expressways</span>
          </p>
          <p>© 2026 EV Charged Network · Bharat EV Protocol Compliant</p>
        </div>
      </div>
    </div>
  );
};
