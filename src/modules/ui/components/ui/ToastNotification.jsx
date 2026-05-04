// ToastNotification.jsx — Success/failure notifications for AutoFix actions

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export default function ToastNotification({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      bg: 'bg-success/90',
      border: 'border-success',
      icon: CheckCircle,
      color: 'text-white',
    },
    error: {
      bg: 'bg-accent/90',
      border: 'border-accent',
      icon: XCircle,
      color: 'text-white',
    },
    warning: {
      bg: 'bg-warning/90',
      border: 'border-warning',
      icon: AlertTriangle,
      color: 'text-base-bg',
    },
    info: {
      bg: 'bg-primary/90',
      border: 'border-primary',
      icon: Info,
      color: 'text-white',
    },
  };

  const { bg, border, icon: Icon, color } = config[toast.type] || config.info;

  return (
    <div
      className={`${bg} ${color} px-4 py-3 rounded-lg shadow-2xl border-2 ${border} backdrop-blur-sm animate-slide-in`}
      style={{
        animation: 'slide-in 0.3s ease-out',
      }}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="shrink-0" />
        <span className="font-medium text-sm">{toast.message}</span>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
