import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Headphones,
  X,
  Phone,
  Truck,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const FloatingContact: React.FC = () => {
  const { isContactDrawerOpen, setIsContactDrawerOpen, stations, showToast } = useApp();
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [issueDescription, setIssueDescription] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    showToast('Station incident ticket dispatched to field maintenance engineering.', 'success');
    setIssueDescription('');
    setDispatchStatus('Ticket #INC-8924 logged. An EV technician is assigned.');
  };

  const handleCallEmergency = () => {
    showToast('Connecting to 24/7 Roadside Mobile Charging Dispatch (Toll-Free 1-800-VOLT-FLOW)...', 'info');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div
        id="floating-contact-btn"
        className="fixed bottom-6 right-6 z-40 no-print"
      >
        <button
          onClick={() => setIsContactDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
          title="24/7 EV Roadside & Station Support"
        >
          <Headphones className="h-4 w-4" />
          <span className="hidden sm:inline">24/7 Roadside Assistance</span>
        </button>
      </div>

      {/* Slide-in Support Drawer */}
      {isContactDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <Headphones className="h-4 w-4" />
                    <span>24/7 DRIVER ASSISTANCE</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">EV Charged Emergency & Support</h3>
                  <p className="text-xs text-neutral-400">Live hardware telemetry and Pan-India roadside rapid dispatch</p>
                </div>
                <button
                  onClick={() => setIsContactDrawerOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Emergency Mobile Charging Van */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Truck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Mobile EV Boost Van</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Stranded with a depleted battery on city streets or national expressways? Our mobile dispatch van delivers 20 kWh on-site emergency charge across all major corridors.
                </p>
                <button
                  onClick={handleCallEmergency}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Emergency Boost: 1800-382-4274 (Toll-Free)</span>
                </button>
              </div>

              {/* Report Stall / Cable Incident */}
              <form onSubmit={handleReportSubmit} className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Report Station Malfunction</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Station Location</label>
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-2 text-xs text-white"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Issue Description</label>
                  <textarea
                    rows={2}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="e.g. Stall #3 CCS2 connector latch stuck or screen error code"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-2 text-xs text-white placeholder-neutral-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors"
                >
                  Submit Incident to Operations
                </button>

                {dispatchStatus && (
                  <p className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{dispatchStatus}</span>
                  </p>
                )}
              </form>

              {/* Live Operator Helpline */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="font-semibold text-white">Average Response Time</p>
                    <p className="text-[11px] text-neutral-400 font-mono">Under 45 seconds</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  ONLINE
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 text-center">
              EV Charged Network Operations Center · Pan-India NOC Active 24/7/365
            </div>
          </div>
        </div>
      )}
    </>
  );
};
