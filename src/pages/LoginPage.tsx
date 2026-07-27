import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AppUser } from '../App';

interface Props {
  onLogin: (user: AppUser) => void;
}

type View = 'login' | 'forgot' | 'forgot-sent';

export default function LoginPage({ onLogin }: Props) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (authError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('id, email, name, role, is_admin, status, avatar_color, initials')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (!participant) {
      await supabase.auth.signOut();
      setError('No account found for this email. Please register or contact your program administrator.');
      setLoading(false);
      return;
    }

    if (participant.status === 'Pending' && !participant.is_admin) {
      await supabase.auth.signOut();
      setError('Your application is pending review. You will receive an email when approved.');
      setLoading(false);
      return;
    }

    onLogin({
      id: data.user.id,
      email: participant.email,
      name: participant.name,
      role: participant.role,
      is_admin: participant.is_admin,
      participant_id: participant.id,
      avatar_color: participant.avatar_color,
      initials: participant.initials,
    });

    setLoading(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setView('forgot-sent');
  }

  const leftPanel = (
    <div className="hidden lg:flex w-1/2 flex-col justify-between p-12" style={{ background: '#0f2744' }}>
      <div>
        <div className="mb-12">
          <img
            src="/WTS_Central_California_Stacked_White.png"
            alt="WTS Central California"
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Empowering Women<br />in Transportation
        </h1>
        <p className="text-base leading-relaxed" style={{ color: '#7a9ab5' }}>
          Connect with mentors, track your progress, and grow your career in the transportation industry.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {[
          { name: 'Diana Reyes', title: 'Senior Transportation Engineer, Caltrans', initials: 'DR', color: '#2a7a6e' },
          { name: 'Patricia Nguyen', title: 'Senior Planner, Fresno COG', initials: 'PN', color: '#2563a8' },
          { name: 'Margaret Kim', title: 'Principal Engineer, Kim Engineering', initials: 'MK', color: '#1a5a8c' },
        ].map(p => (
          <div key={p.name} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: p.color }}>
              {p.initials}
            </div>
            <div>
              <p className="text-white text-sm font-medium leading-none">{p.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#7a9ab5' }}>{p.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const mobileHeader = (
    <div className="lg:hidden flex justify-center mb-8">
      <img
        src="/WTS_Central_California_Stacked_White.png"
        alt="WTS Central California"
        className="h-12 w-auto object-contain"
        style={{ filter: 'invert(1) sepia(1) saturate(0) brightness(0.3)' }}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f4f8' }}>
      {leftPanel}

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {mobileHeader}

          {view === 'login' && (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Welcome back</h2>
              <p className="text-sm mb-8" style={{ color: '#5a7a9a' }}>Sign in to your mentorship account</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                    style={{ background: '#fff', border: '1.5px solid #c8d8e8', color: '#1a3a5c' }}
                    onFocus={e => (e.target.style.borderColor = '#2563a8')}
                    onBlur={e => (e.target.style.borderColor = '#c8d8e8')}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold" style={{ color: '#1a3a5c' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setError(null); setView('forgot'); }}
                      className="text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ color: '#2563a8' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: '#5a7a9a' }}>
                New to the program?{' '}
                <Link to="/register" className="font-semibold" style={{ color: '#2563a8' }}>Apply here</Link>
              </p>
            </>
          )}

          {view === 'forgot' && (
            <>
              <button
                onClick={() => { setError(null); setView('login'); }}
                className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
                style={{ color: '#5a7a9a' }}
              >
                <span>&#8592;</span> Back to sign in
              </button>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Reset your password</h2>
              <p className="text-sm mb-8" style={{ color: '#5a7a9a' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>Email address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
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
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          {view === 'forgot-sent' && (
            <>
              <div className="flex flex-col items-center text-center gap-4 mt-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2" style={{ background: '#e8f4ed' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a7a6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Check your inbox</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#5a7a9a' }}>
                  We've sent a password reset link to <span className="font-semibold" style={{ color: '#1a3a5c' }}>{resetEmail}</span>. Check your email and follow the link to create a new password.
                </p>
                <p className="text-xs mt-2" style={{ color: '#8aabca' }}>
                  Didn't receive it? Check your spam folder or{' '}
                  <button
                    onClick={() => { setError(null); setView('forgot'); }}
                    className="underline font-medium"
                    style={{ color: '#2563a8' }}
                  >
                    try again
                  </button>.
                </p>
              </div>
              <button
                onClick={() => { setError(null); setView('login'); }}
                className="w-full rounded-lg py-3 font-semibold text-sm transition-opacity mt-8 hover:opacity-80"
                style={{ background: '#e8eef6', color: '#1a3a5c' }}
              >
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
