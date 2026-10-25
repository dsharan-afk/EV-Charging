/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { StationsView } from './components/StationsView';
import { VehicleView } from './components/VehicleView';
import { BookingView } from './components/BookingView';
import { ProfileView } from './components/ProfileView';
import { FaqView } from './components/FaqView';
import { LoginPageView } from './components/LoginPageView';
import { LiveChargingModal } from './components/LiveChargingModal';
import { PaymentCheckoutModal } from './components/PaymentCheckoutModal';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';
import { SiteSearchModal } from './components/SiteSearchModal';
import { CookieBanner } from './components/CookieBanner';
import { BackToTopButton } from './components/BackToTopButton';
import { FloatingContact } from './components/FloatingContact';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { Zap } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAuthenticated,
    utmParams,
  } = useApp();

  // If user is not logged in, render the dedicated Login Page first (not combined with navbar/dashboard)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-emerald-500 selection:text-neutral-950">
        <ScrollProgressBar />
        <LoginPageView />
        <ConfirmationModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 transition-colors duration-200">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      <Navbar />

      {/* Main Content with id="main-content" for Skip to Content */}
      <main
        id="main-content"
        className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 focus:outline-none"
        tabIndex={-1}
      >
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'stations' && <StationsView />}
        {activeTab === 'vehicle' && <VehicleView />}
        {activeTab === 'booking' && <BookingView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'faq' && <FaqView />}
      </main>

      {/* Modals, Overlays & Micro-features */}
      <AuthModal />
      <SiteSearchModal />
      <CookieBanner />
      <BackToTopButton />
      <FloatingContact />
      <ConfirmationModal />
      <LiveChargingModal />
      <PaymentCheckoutModal />
      <ToastContainer />

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 text-xs text-neutral-500 no-print">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-neutral-300">EV Charged India</span>
            <span className="text-neutral-700">·</span>
            <span>Pan-India Power Station & Expressway Network</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-neutral-400">
            <button
              onClick={() => setActiveTab('stations')}
              className="hover:text-emerald-400 transition-colors"
            >
              State-Wise Power Stations
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className="hover:text-white transition-colors"
            >
              EV Garage
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className="hover:text-white transition-colors"
            >
              Slot Booking
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="hover:text-white transition-colors"
            >
              Wallet & Invoices
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className="hover:text-white transition-colors"
            >
              FAQ
            </button>
          </div>

          <div className="text-neutral-600 font-mono text-[11px] flex items-center gap-2">
            <span>Pan-India EV Grid · Spring Boot & React</span>
            {utmParams.source && (
              <span className="text-[10px] text-emerald-400">
                · {utmParams.source}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
