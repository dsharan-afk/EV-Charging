import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  BatteryCharging,
  Pause,
  Play,
  Square,
  Minimize2,
  Maximize2,
  Clock,
  Gauge,
  DollarSign,
  ShieldAlert,
  ChevronUp,
} from 'lucide-react';

export const LiveChargingModal: React.FC = () => {
  const {
    activeSession,
    pauseChargingSession,
    resumeChargingSession,
    stopChargingSession,
  } = useApp();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeSession) return null;

  const minutes = Math.floor(activeSession.elapsedTimeSeconds / 60);
  const seconds = activeSession.elapsedTimeSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-900 border border-emerald-500/80 shadow-2xl shadow-emerald-500/20 text-white hover:bg-neutral-800 transition-all"
        >
          <div className="relative flex items-center justify-center">
            <BatteryCharging className="h-5 w-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-left text-xs font-mono">
            <span className="font-bold text-emerald-400 text-sm">{activeSession.currentSoc}%</span>
            <span className="text-neutral-400 ml-2">({activeSession.energyDeliveredKwh} kWh)</span>
          </div>
          <Maximize2 className="h-4 w-4 text-neutral-400 ml-2" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Controls */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                {activeSession.status === 'CHARGING' ? 'Live Telemetry Active' : 'Session Paused'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">{activeSession.stationName}</h2>
            <p className="text-xs text-neutral-400">
              Stall #{activeSession.portNumber} · {activeSession.vehicleName}
            </p>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="Minimize to floating widget"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>

        {/* Circular Battery Progress Centerpiece */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex items-center justify-center w-52 h-52">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                className="text-neutral-800"
                fill="none"
              />
              {/* Animated Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * activeSession.currentSoc) / 100}
                strokeLinecap="round"
                className="text-emerald-400 transition-all duration-500 ease-out"
                fill="none"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <BatteryCharging className="h-6 w-6 text-emerald-400 mb-1" />
              <div className="text-4xl font-extrabold text-white font-mono tracking-tight tabular-nums">
                {activeSession.currentSoc}%
              </div>
              <div className="text-xs font-mono text-neutral-400 mt-0.5">
                Target: {activeSession.targetSoc}%
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 mt-1">
                +{activeSession.currentSoc - activeSession.initialSoc}% added
              </div>
            </div>
          </div>
        </div>

        {/* Live Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Flow Rate</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {activeSession.status === 'CHARGING' ? activeSession.currentPowerKw : 0} kW
            </span>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Delivered</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {activeSession.energyDeliveredKwh} kWh
            </span>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Duration</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {formattedTime}
            </span>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Accrued Cost</span>
            <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              ₹{activeSession.costAccrued.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Rate Notice */}
        <p className="text-[11px] text-neutral-500 text-center font-mono">
          Billed at ₹{activeSession.ratePerKwh.toFixed(2)}/kWh · Grid frequency 50Hz stable
        </p>

        {/* Interactive Control Buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
          {activeSession.status === 'CHARGING' ? (
            <button
              onClick={pauseChargingSession}
              className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Pause className="h-4 w-4" />
              <span>Pause Charging</span>
            </button>
          ) : (
            <button
              onClick={resumeChargingSession}
              className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-current text-emerald-400" />
              <span>Resume Charging</span>
            </button>
          )}

          <button
            onClick={stopChargingSession}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
          >
            <Square className="h-4 w-4 fill-current" />
            <span>Stop & Pay Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
