import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[300px] animate-slide-up
              ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : ''}
              ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
              ${toast.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
            `}
          >
            <div className="shrink-0">
               {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500"/>}
               {toast.type === 'error' && <AlertCircle size={18} className="text-red-500"/>}
               {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-500"/>}
               {toast.type === 'info' && <Info size={18} className="text-blue-500"/>}
            </div>
            <div className="flex-1">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};