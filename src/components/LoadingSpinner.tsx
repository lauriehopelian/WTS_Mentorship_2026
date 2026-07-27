import React from 'react';

interface LoadingSpinnerProps {
  overlay?: boolean;
  size?: number;
  color?: string;
}

export default function LoadingSpinner({ overlay = false, size = 32, color = '#1a6b6e' }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className="rounded-full animate-spin"
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}22`,
        borderTopColor: color,
      }}
    />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(250,247,242,0.8)', backdropFilter: 'blur(2px)' }}>
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <LoadingSpinner size={40} />
    </div>
  );
}
