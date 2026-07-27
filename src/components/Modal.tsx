import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,31,60,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`w-full ${sizeClass[size]} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}
        style={{ animation: 'modal-in 0.18s ease-out' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e4dfd5' }}>
            <h2 className="text-lg font-semibold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
              style={{ color: '#6b6560' }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: '#e4dfd5', background: '#faf7f2', borderRadius: '0 0 1rem 1rem' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
