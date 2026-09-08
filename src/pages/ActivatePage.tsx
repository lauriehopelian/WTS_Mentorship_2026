import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppUser } from '../App';

export default function ActivatePage({ onActivated }: { onActivated: () => Promise<void> | void }) {
  const user = useAppUser();
  const [activating, setActivating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;
  if (user.status !== 'Pending' || user.is_admin || done) return <Navigate to="/dashboard" replace />;

  async function activate() {
    setActivating(true);
    setError(null);

    const { error: invokeError } = await supabase.functions.invoke('activate-participant');
    if (invokeError) {
      setError('We could not activate your portal access. Please contact the WTS CenCal mentorship program administrator.');
      setActivating(false);
      return;
    }

    await onActivated();
    setDone(true);
    setActivating(false);
  }

  const logoUrl = `${import.meta.env.BASE_URL}WTS_Central_California_Stacked_White.png`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#f0f4f8' }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border p-8 text-center" style={{ borderColor: '#dbe5ef' }}>
        <div className="rounded-xl p-5 mb-7" style={{ background: '#0f2744' }}>
          <img src={logoUrl} alt="WTS Central California" className="h-12 w-auto mx-auto object-contain" />
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>
          Welcome to the Mentorship Portal
        </h1>
        <p className="text-sm leading-relaxed mb-7" style={{ color: '#5a7a9a' }}>
          Your application has been approved and your invitation is ready to activate. Confirm below to finish setting up portal access for <strong>{user.email}</strong>.
        </p>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm mb-5 text-left" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <button
          onClick={activate}
          disabled={activating}
          className="w-full rounded-lg py-3 font-semibold text-white text-sm transition-opacity"
          style={{ background: '#2563a8', opacity: activating ? 0.6 : 1 }}
        >
          {activating ? 'Activating…' : 'Activate portal access'}
        </button>

        <p className="text-xs mt-5" style={{ color: '#8a9baa' }}>
          This portal is available only to approved WTS Central California mentorship program participants.
        </p>
      </div>
    </div>
  );
}
