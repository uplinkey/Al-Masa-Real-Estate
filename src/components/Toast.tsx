import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'restore' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Global Event for firing toasts anywhere in the application
const TOAST_EVENT = 'almasa_app_toast';

export const toast = {
  success: (message: string, duration = 3500) => {
    dispatchToast(message, 'success', duration);
  },
  restore: (message: string, duration = 3500) => {
    dispatchToast(message, 'restore', duration);
  },
  error: (message: string, duration = 4000) => {
    dispatchToast(message, 'error', duration);
  },
  info: (message: string, duration = 3500) => {
    dispatchToast(message, 'info', duration);
  },
};

export const showToast = (message: string, type: ToastType = 'success', duration = 3500) => {
  dispatchToast(message, type, duration);
};

function dispatchToast(message: string, type: ToastType, duration: number) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<ToastMessage>(TOAST_EVENT, {
      detail: {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        message,
        type,
        duration,
      },
    });
    window.dispatchEvent(event);
  }
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration);
    };

    window.addEventListener(TOAST_EVENT, handleNewToast);
    return () => window.removeEventListener(TOAST_EVENT, handleNewToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none max-w-md w-full px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            t.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50 shadow-emerald-950/50'
              : t.type === 'restore'
              ? 'bg-purple-950/90 text-purple-100 border-purple-500/50 shadow-purple-950/50'
              : t.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-500/50 shadow-rose-950/50'
              : 'bg-slate-900/90 text-slate-100 border-slate-700 shadow-slate-950/50'
          }`}
          style={{ minWidth: '280px' }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {t.type === 'restore' && <RotateCcw className="w-4 h-4 text-purple-400 animate-spin-reverse" />}
              {t.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            </span>
            <span className="text-xs font-bold leading-relaxed">{t.message}</span>
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-white/60 hover:text-white shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
