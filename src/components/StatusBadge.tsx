import React from 'react';
import { STATUS_COLORS } from '../lib/constants';

interface StatusBadgeProps {
  status: string;
  small?: boolean;
}

export default function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const cfg = (STATUS_COLORS as Record<string, { bg: string; text: string; border: string }>)[status] || {
    bg: '#f0ebe2', text: '#6b6560', border: '#6b6560',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${small ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {status}
    </span>
  );
}
