import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 p-3.5 rounded-xl border shadow-xl text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              isSuccess
                ? 'bg-neutral-950/90 border-emerald-500/50 text-white'
                : isError
                ? 'bg-neutral-950/90 border-rose-500/50 text-white'
                : isWarning
                ? 'bg-neutral-950/90 border-amber-500/50 text-white'
                : 'bg-neutral-950/90 border-neutral-700 text-white'
            }`}
          >
            {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {isError && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            {isWarning && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
            {!isSuccess && !isError && !isWarning && <Info className="h-4 w-4 text-blue-400 shrink-0" />}

            <span className="leading-tight">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
