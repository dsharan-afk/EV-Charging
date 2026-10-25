import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ConfirmationModal: React.FC = () => {
  const { confirmationModal, closeConfirmationModal } = useApp();

  if (!confirmationModal.isOpen) return null;

  const handleConfirm = () => {
    confirmationModal.onConfirm();
    closeConfirmationModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                confirmationModal.isDestructive
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {confirmationModal.isDestructive ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {confirmationModal.title}
              </h3>
            </div>
          </div>
          <button
            onClick={closeConfirmationModal}
            className="text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          {confirmationModal.message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={closeConfirmationModal}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            {confirmationModal.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              confirmationModal.isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
            }`}
          >
            {confirmationModal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
