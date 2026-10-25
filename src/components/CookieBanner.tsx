import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Cookie, X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const { cookieConsent, acceptCookies, rejectCookies } = useApp();
  const [showPreferences, setShowPreferences] = useState(false);

  // If user already made a choice, hide
  if (cookieConsent !== null) return null;

  return (
    <div
      id="cookie-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cookie className="h-4 w-4 text-emerald-400 shrink-0" />
          <h4 className="font-bold text-white text-xs">Cookie & Privacy Preferences</h4>
        </div>
        <button
          onClick={rejectCookies}
          className="text-neutral-500 hover:text-neutral-300"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-neutral-300 leading-relaxed text-[11px]">
        EV Charged uses essential cookies for cryptographic session authentication, remembering EV charging preferences, and optimizing station routing telemetry.
      </p>

      {showPreferences && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Essential Authentication</span>
            <span className="text-emerald-400 font-mono">Required</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">Station Telemetry Cache</span>
            <input type="checkbox" defaultChecked className="accent-emerald-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">Anonymous Fleet Analytics</span>
            <input type="checkbox" defaultChecked className="accent-emerald-500" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={acceptCookies}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors text-center text-xs"
        >
          Accept All
        </button>
        <button
          onClick={rejectCookies}
          className="py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs"
        >
          Essential Only
        </button>
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="py-2 px-2 text-neutral-400 hover:text-neutral-200 text-[11px] underline underline-offset-2"
        >
          {showPreferences ? 'Hide' : 'Options'}
        </button>
      </div>
    </div>
  );
};
