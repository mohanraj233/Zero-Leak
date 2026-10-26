'use client';

import React from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useZeroLeak();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-blue-500/30 bg-slate-900/95 text-slate-100';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/30 bg-slate-900/95 text-slate-100';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40 bg-slate-900/95 text-slate-100';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40 bg-slate-900/95 text-slate-100';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              <div className="text-xs font-semibold tracking-wide uppercase opacity-90">{toast.title}</div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
