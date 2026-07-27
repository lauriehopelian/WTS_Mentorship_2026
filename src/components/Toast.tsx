import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const typeConfig = {
  success: { icon: CheckCircle, bg: '#f0fdf4', border: '#22c55e', text: '#15803d', iconColor: '#22c55e' },
  error: { icon: AlertCircle, bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', iconColor: '#ef4444' },
  warning: { icon: AlertTriangle, bg: '#fffbeb', border: '#c8922a', text: '#92400e', iconColor: '#c8922a' },
  info: { icon: Info, bg: '#faf7f2', border: '#1a6b6e', text: '#0a1f3c', iconColor: '#1a6b6e' },
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const cfg = typeConfig[toast.type] || typeConfig.info;
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg max-w-sm animate-slide-up"
            style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
          >
            <Icon size={18} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm flex-1" style={{ color: cfg.text, lineHeight: 1.5 }}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity ml-1"
              style={{ color: cfg.text }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
