import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HERO_IMAGE_URL } from '../data/mockData';
import {
  MapPin,
  Zap,
  Battery,
  Calendar,
  CreditCard,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Compass,
  Map as MapIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { GoogleMapView } from './GoogleMapView';

export const HomeView: React.FC = () => {
  const {
    setActiveTab,
    primaryVehicle,
    stations,
    openBookingForStation,
    setSelectedStation,
    selectedStation,
    setSearchQuery,
    setIsArchitectureModalOpen,
  } = useApp();

  const [heroSearch, setHeroSearch] = useState('');
  const [heroDisplayMode, setHeroDisplayMode] = useState<'google' | 'photo' | 'map'>('google');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setSearchQuery(heroSearch.trim());
    }
    setActiveTab('stations');
  };

  const nearbyStations = stations.slice(0, 3);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Proposition & Action */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="tracking-wide">PAN-INDIA HIGH-POWER EV CHARGING NETWORK</span>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400">Up to 350kW DC Fast Charge</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-[1.15]">
                Power your electric journey across all of India.
              </h1>

              <p className="text-base text-neutral-300 max-w-xl leading-relaxed">
                Seamless charging in Chennai, Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Kolkata, Ahmedabad, and key National Expressways. Reserve stalls in advance, track live battery SoC, and pay in seconds with UPI.
              </p>
            </div>

            {/* Quick Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Enter city, address, or station name..."
                  className="w-full rounded-xl bg-neutral-950/90 border border-neutral-700/80 pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-sm hover:bg-emerald-400 transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/20"
              >
                <span>Find Stations</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Live Connected Vehicle Quick Snapshot */}
            {primaryVehicle && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Battery className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-neutral-200">
                      {primaryVehicle.make} {primaryVehicle.model}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      ({primaryVehicle.licensePlate})
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('vehicle')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    <span>Manage Garage</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${primaryVehicle.currentSocPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap font-mono text-xs">
                    <span className="font-bold text-white tabular-nums">{primaryVehicle.currentSocPercent}%</span>
                    <span className="text-neutral-400 ml-1">· ~{primaryVehicle.estimatedRangeKm} km</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Hero Visual or Google Map Container */}
          <div className="lg:col-span-5 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pan-India Power Stations</span>
              </span>
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setHeroDisplayMode('google')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    heroDisplayMode === 'google'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>Google Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroDisplayMode('photo')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    heroDisplayMode === 'photo'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Station Photo
                </button>
                <button
                  type="button"
                  onClick={() => setHeroDisplayMode('map')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    heroDisplayMode === 'map'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Grid Map
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-[360px] lg:min-h-[420px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
              {heroDisplayMode === 'google' ? (
                <div className="relative w-full h-full min-h-[360px]">
                  <GoogleMapView
                    stations={stations}
                    selectedStation={selectedStation}
                    onSelectStation={(stn) => {
                      setSelectedStation(stn);
                      openBookingForStation(stn);
                    }}
                    activeCityKey="ALL"
                  />
                </div>
              ) : heroDisplayMode === 'photo' ? (
                <div className="relative w-full h-full min-h-[360px]">
                  <img
                    src={HERO_IMAGE_URL}
                    alt="Ultra-modern EV Charging Station Hub"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent pointer-events-none" />

                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 font-mono">
                          Tamil Nadu
                        </span>
                        <p className="text-xs font-semibold text-white">OMR IT Corridor Hub (Chennai)</p>
                      </div>
                      <p className="text-[11px] text-neutral-300 mt-0.5">6 of 8 stalls open · 240kW CCS2 & Type-2</p>
                    </div>
                    <button
                      onClick={() => {
                        const stn = stations.find((s) => s.id === 'stn_chn_101') || stations[0];
                        if (stn) openBookingForStation(stn);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 text-neutral-950 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/20"
                    >
                      Book Stall
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[360px] p-4 flex flex-col justify-between bg-neutral-950 overflow-hidden">
                  {/* Rotating Conical Radar Beam and Laser Scanline */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full animate-radar-sweep pointer-events-none opacity-35"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.12) 320deg, rgba(52, 211, 153, 0.5) 360deg)',
                      }}
                    />
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent animate-scanline pointer-events-none" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      <span>Live All-India Power Stations</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                        Live Radar
                      </span>
                    </span>
                    <button
                      onClick={() => setActiveTab('stations')}
                      className="text-[11px] text-emerald-400 hover:underline font-semibold"
                    >
                      Open State-Wise Explorer →
                    </button>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 gap-2 my-auto py-2">
                    {stations.slice(0, 6).map((stn) => (
                      <button
                        key={stn.id}
                        onClick={() => {
                          setSelectedStation(stn);
                          setActiveTab('stations');
                        }}
                        className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 hover:border-emerald-500/60 text-left transition-all backdrop-blur-sm group"
                      >
                        <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>{stn.state} · {stn.city}</span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{stn.name}</div>
                        <div className="text-[10px] text-neutral-400 flex items-center justify-between mt-1 font-mono">
                          <span>{stn.powerKw}kW DC</span>
                          <span className="text-emerald-400 font-bold">{stn.availablePorts} ports open</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('stations')}
                    className="relative z-10 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500 hover:text-neutral-950 transition-colors text-center shadow-lg"
                  >
                    View All {stations.length} Indian Power Stations (State-Wise)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Key Performance Metrics Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-medium text-neutral-400">Available Stations</p>
          <p className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">{stations.length} Hubs</p>
          <p className="mt-1 text-xs text-emerald-400">Across 12+ States & Corridors</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-medium text-neutral-400">Charging Speeds</p>
          <p className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">Up to 350 kW</p>
          <p className="mt-1 text-xs text-neutral-400">10% to 80% in 18 mins</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-medium text-neutral-400">Clean Energy Saved</p>
          <p className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">1,140 kg CO₂</p>
          <p className="mt-1 text-xs text-emerald-400">Rahul's total impact</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <p className="text-xs font-medium text-neutral-400">Payment Security</p>
          <p className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">One-Tap</p>
          <p className="mt-1 text-xs text-neutral-400">UPI, RuPay & Cards</p>
        </div>
      </section>

      {/* Featured Stations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Pan-India Fast Charging Hubs & Expressways</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Real-time availability, state DISCOM grid telemetry, and dynamic charging rates</p>
          </div>
          <button
            onClick={() => setActiveTab('stations')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Explore All India Map</span>
            <Compass className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {nearbyStations.map((station) => (
            <div
              key={station.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 hover:border-neutral-700 transition-all hover:bg-neutral-900/80 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white text-base group-hover:text-emerald-400 transition-colors">
                      {station.name}
                    </h3>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-neutral-500 shrink-0" />
                      <span>{station.address}, {station.city}, {station.state}</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 whitespace-nowrap tabular-nums">
                    {station.distanceKm} km
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-neutral-800/80">
                  <div>
                    <span className="text-neutral-500 block">Speed</span>
                    <span className="font-semibold text-white font-mono">{station.powerKw} kW DC</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Stall Availability</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {station.availablePorts} / {station.totalPorts} Open
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Rate</span>
                    <span className="font-semibold text-white font-mono">₹{station.pricingPerKwh.toFixed(2)}/kWh</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Rating</span>
                    <span className="font-semibold text-amber-300">★ {station.rating}</span>
                  </div>
                </div>

                {/* Connectors tag line */}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-neutral-400">
                  {Array.from(new Set(station.ports.map((p) => p.connectorType))).map((conn) => (
                    <span key={conn} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {conn}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center gap-2">
                <button
                  onClick={() => openBookingForStation(station)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors text-center"
                >
                  Reserve Slot
                </button>
                <button
                  onClick={() => {
                    setSelectedStation(station);
                    setActiveTab('stations');
                  }}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Step How It Works Section */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">How EV Charged Operates</h2>
          <p className="text-xs text-neutral-400 mt-1">Seamless end-to-end electric mobility workflow</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-emerald-400 font-mono font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-white text-sm">Locate Nearby Stations</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Real-time map and directory filtering by charging power (up to 350kW), connector type (CCS2, Type-2), and live open stalls across Chennai.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-emerald-400 font-mono font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-white text-sm">Reserve Your Port</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Lock in your desired stall and time slot in advance. Avoid waiting in queues and receive a cryptographically secured digital pass.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-emerald-400 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-white text-sm">Plug In & Live Monitor</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Watch real-time energy flow in kW, battery SoC rising, session time elapsed, and transparent running cost accumulation in Indian Rupees (₹).
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-emerald-400 font-mono font-bold text-sm">
              04
            </div>
            <h3 className="font-semibold text-white text-sm">Frictionless Payment</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Auto-deduct from your EV Charged Wallet, tap with RFID ChargePass, or pay via UPI, RuPay & Cards with itemized electronic invoices.
            </p>
          </div>
        </div>
      </section>

      {/* Pan-India Power Station Network Banner */}
      <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Zap className="h-4 w-4" />
            <span>PAN-INDIA FAST CHARGING & POWER GRID NETWORK</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white">
            High-Power EV Charging Hubs Across 17+ Indian States & Expressways
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Search charging power stations state-by-state across Maharashtra, Tamil Nadu, Karnataka, Delhi NCR, Gujarat, Uttar Pradesh, Rajasthan, Kerala, West Bengal, and national expressways with real-time port availability and instant reservations.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('stations')}
          className="px-5 py-3 rounded-xl bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm shadow-emerald-500/20"
        >
          <span>Search Stations State-Wise</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>
    </div>
  );
};
