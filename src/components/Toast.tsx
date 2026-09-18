import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      id="global-toast"
      className="fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-semibold border border-slate-700/80">
        {toast.isError ? (
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span id="toast-message-text">{toast.message}</span>
      </div>
    </div>
  );
};
