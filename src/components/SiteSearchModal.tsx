import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, MapPin, Zap, Car, Calendar, User, HelpCircle, Layers, X, ArrowRight } from 'lucide-react';
import { NavTab } from '../types';

export const SiteSearchModal: React.FC = () => {
  const {
    isSearchPaletteOpen,
    setIsSearchPaletteOpen,
    stations,
    vehicles,
    setActiveTab,
    setSelectedStation,
    openBookingForStation,
    setIsArchitectureModalOpen,
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isSearchPaletteOpen) {
      setQuery('');
    }
  }, [isSearchPaletteOpen]);

  if (!isSearchPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results
  const matchedStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      (s.discom && s.discom.toLowerCase().includes(q))
  );

  const matchedVehicles = vehicles.filter(
    (v) =>
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q)
  );

  const navigationPages: { tab: NavTab; title: string; desc: string; icon: React.ReactNode }[] = [
    { tab: 'home', title: 'Home Dashboard', desc: 'Battery summary & nearby fast chargers', icon: <Zap className="h-4 w-4" /> },
    { tab: 'stations', title: 'Charging Stations Locator', desc: 'Pan-India Google Maps & live port availability', icon: <MapPin className="h-4 w-4" /> },
    { tab: 'vehicle', title: 'My Vehicle Garage', desc: 'EV specs, battery state of charge & telemetry', icon: <Car className="h-4 w-4" /> },
    { tab: 'booking', title: 'Slot Reservation Engine', desc: 'Schedule guaranteed charging ports & QR passes', icon: <Calendar className="h-4 w-4" /> },
    { tab: 'profile', title: 'User Profile & Wallet', desc: 'Prepaid balance, RFID cards & billing invoices', icon: <User className="h-4 w-4" /> },
    { tab: 'faq', title: 'Frequently Asked Questions', desc: 'Charging standards, pricing, idle fees & guide', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const matchedPages = navigationPages.filter(
    (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-neutral-800 pb-3">
          <Search className="h-5 w-5 text-neutral-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stations, garage vehicles, pages, or features..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <button
            onClick={() => setIsSearchPaletteOpen(false)}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Section: Charging Stations */}
          {matchedStations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-2">
                Charging Hubs ({matchedStations.length})
              </span>
              <div className="space-y-1">
                {matchedStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station);
                      setActiveTab('stations');
                      setIsSearchPaletteOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-900 transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {station.name}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {station.city}, {station.state} · {station.powerKw}kW · {station.availablePorts} ports open
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Navigation Views */}
          {matchedPages.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-2">
                Pages & Navigation
              </span>
              <div className="space-y-1">
                {matchedPages.map((page) => (
                  <button
                    key={page.tab}
                    onClick={() => {
                      setActiveTab(page.tab);
                      setIsSearchPaletteOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-900 transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                        {page.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {page.title}
                        </p>
                        <p className="text-[11px] text-neutral-400">{page.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}


        </div>

        {/* Footer Shortcut Helper */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Press ESC to close</span>
          <span className="font-mono">Cmd + K</span>
        </div>
      </div>
    </div>
  );
};
