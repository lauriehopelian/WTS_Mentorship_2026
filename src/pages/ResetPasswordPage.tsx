import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('This reset link is invalid or has expired. Please request a new one.');
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Failed to update password. Please try again.');
      return;
    }

    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#f0f4f8' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img
            src="/WTS_Central_California_Stacked_White.png"
            alt="WTS Central California"
            className="h-12 w-auto object-contain"
            style={{ filter: 'invert(1) sepia(1) saturate(0) brightness(0.3)' }}
          />
        </div>

        <h2 className="text-2xl font-bold mb-1 text-center" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>
          Create new password
        </h2>
        <p className="text-sm mb-8 text-center" style={{ color: '#5a7a9a' }}>
          Choose a strong password for your account.
        </p>

        {!ready ? (
          <div className="rounded-lg px-4 py-3 text-sm text-center" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            {error ?? 'Verifying reset link…'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: '#fff', border: '1.5px solid #c8d8e8', color: '#1a3a5c' }}
                onFocus={e => (e.target.style.borderColor = '#2563a8')}
                onBlur={e => (e.target.style.borderColor = '#c8d8e8')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ background: '#fff', border: '1.5px solid #c8d8e8', color: '#1a3a5c' }}
                onFocus={e => (e.target.style.borderColor = '#2563a8')}
                onBlur={e => (e.target.style.borderColor = '#c8d8e8')}
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 font-semibold text-white text-sm transition-opacity mt-1"
              style={{ background: '#2563a8', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        )}

        {!ready && error && (
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg py-3 font-semibold text-sm transition-opacity mt-4 hover:opacity-80"
            style={{ background: '#e8eef6', color: '#1a3a5c' }}
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
