import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      setToasts((previous) => [...previous, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition transform animate-fadeIn ${
              toast.type === 'success'
                ? 'border-emerald-500/40 bg-slate-900/95 text-emerald-300 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'border-rose-500/40 bg-slate-900/95 text-rose-300 shadow-rose-500/10'
                : 'border-teal-500/40 bg-slate-900/95 text-teal-300 shadow-teal-500/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />}
              {toast.type === 'info' && <Info className="h-5 w-5 shrink-0 text-teal-400" />}
              <span className="text-xs font-semibold leading-relaxed text-slate-100">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};