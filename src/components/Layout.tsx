import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  role: string;
  children: React.ReactNode;
}

export default function Layout({ role, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ background: '#f0f4f8' }}>
      <Sidebar role={role} />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
