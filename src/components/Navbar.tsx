import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  BatteryCharging,
  Layers,
  ShieldCheck,
  User,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  LogIn,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { NavTab } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    toggleUserRole,
    activeSession,
    setIsArchitectureModalOpen,
    theme,
    toggleTheme,
    setIsSearchPaletteOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isAuthenticated,
    setIsAuthModalOpen,
    logout,
  } = useApp();

  const navLinks: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'stations', label: 'Charging Stations' },
    { id: 'vehicle', label: 'My Vehicle' },
    { id: 'booking', label: 'Booking' },
    { id: 'profile', label: 'Profile & Wallet' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <>
      {/* Feature 12: Skip to content accessible affordance */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-neutral-950 focus:font-bold focus:rounded-xl focus:shadow-2xl"
      >
        Skip to main content
      </a>

      {/* Feature 11: Sticky Navigation Bar with backdrop blur */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark with icon */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="h-5 w-5 fill-emerald-500/30" />
            </div>
            <span className="text-xl font-bold tracking-tight">EV <span className="text-emerald-400">Charged</span></span>
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-300">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`relative py-1 text-sm transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-5 h-0.5 bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action cluster */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Feature 3: Site search shortcut */}
            <button
              onClick={() => setIsSearchPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg hover:text-white hover:border-neutral-700 transition-colors"
              title="Site Search (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline font-mono text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                ⌘K
              </kbd>
            </button>

            {/* Feature 1: Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-neutral-300" />
              )}
            </button>

            {/* Active charging live indicator button */}
            {activeSession && (
              <button
                onClick={() => setActiveTab('stations')}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
                title="View live active charging session"
              >
                <BatteryCharging className="h-4 w-4 animate-bounce text-emerald-400" />
                <span className="hidden sm:inline">Charging:</span>
                <span>{activeSession.currentSoc}%</span>
              </button>
            )}



            {/* User Auth / Profile */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                  title="View Profile & Wallet"
                >
                  <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                    ₹{user.walletBalance.toFixed(2)}
                  </span>
                  <span className="text-neutral-600">|</span>
                  <span className="flex items-center gap-1 text-neutral-200">
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400 hover:border-rose-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Log Out of Session"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Feature 5: Mobile Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-800/80">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                    activeTab === link.id
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end pt-1 text-xs">
              <button
                onClick={toggleUserRole}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-white"
              >
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>{user.role === 'ADMIN' ? 'Admin Mode' : 'Customer Mode'}</span>
              </button>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
};
