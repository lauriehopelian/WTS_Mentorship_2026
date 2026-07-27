import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const EMAIL_KEYS = ['wts_resend_key', 'wts_from_email', 'wts_app_url'];
const MEETING_KEYS = ['wts_teams_link'];
const LABELS: Record<string, string> = {
  wts_resend_key: 'Resend API Key',
  wts_from_email: 'From Email Address',
  wts_app_url: 'Deployed App URL',
  wts_teams_link: 'Monthly Meeting Link (Teams / Zoom)',
};
const SECRET_KEYS = ['wts_resend_key'];

export default function SettingsPage() {
  const { showToast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_config').select('key, value');
      const map: Record<string, string> = {};
      (data || []).forEach(row => { map[row.key] = row.value; });
      setValues(map);
      setLoading(false);
    }
    load();
  }, []);

  async function save(key: string) {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key, value: values[key] || '' }, { onConflict: 'key' });
    if (error) {
      showToast('Failed to save.', 'error');
    } else {
      setEditing(prev => ({ ...prev, [key]: false }));
      showToast('Setting updated.', 'success');
    }
  }

  async function handleReset() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) return null;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#5a7a9a' }}>Manage portal configuration</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden mb-6" style={{ borderColor: '#d4e4f0' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#e8eef5', background: '#f0f4f8' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1a3a5c' }}>Email Configuration</h2>
          <p className="text-xs mt-0.5" style={{ color: '#5a7a9a' }}>Used for sending welcome, match, and announcement emails.</p>
        </div>

        <div className="divide-y" style={{ borderColor: '#e8eef5' }}>
          {EMAIL_KEYS.map(key => {
            const isEdit = editing[key];
            const isSecret = SECRET_KEYS.includes(key);
            const isVisible = visible[key];
            const val = values[key] || '';
            const masked = isSecret ? val.slice(0, 4) + '••••••••' + val.slice(-4) : val;

            return (
              <div key={key} className="px-5 py-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#5a7a9a' }}>{LABELS[key]}</label>
                {isEdit ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={isSecret && !isVisible ? 'password' : 'text'}
                        value={val}
                        onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none pr-8"
                        style={{ border: '1.5px solid #2563a8', background: '#f0f4f8' }}
                        autoFocus
                      />
                      {isSecret && (
                        <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#5a7a9a' }} onClick={() => setVisible(prev => ({ ...prev, [key]: !prev[key] }))}>
                          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    <button onClick={() => save(key)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#2563a8' }}>
                      <Check size={14} /> Save
                    </button>
                    <button onClick={() => setEditing(prev => ({ ...prev, [key]: false }))} className="px-3 py-2 rounded-lg text-sm border" style={{ color: '#5a7a9a', borderColor: '#c8d8e8' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm" style={{ color: val ? '#1a3a5c' : '#9ab5cc', fontFamily: "'DM Mono', monospace" }}>
                      {val ? (isSecret ? masked : val) : '— not set —'}
                    </code>
                    <button onClick={() => setEditing(prev => ({ ...prev, [key]: true }))} className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-blue-50" style={{ color: '#1a3a5c', borderColor: '#c8d8e8' }}>
                      Update
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden mb-6" style={{ borderColor: '#d4e4f0' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#e8eef5', background: '#f0f4f8' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1a3a5c' }}>Monthly Mentorship Meeting</h2>
          <p className="text-xs mt-0.5" style={{ color: '#5a7a9a' }}>The meeting link shown on dashboards for the first Tuesday of every month.</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#e8eef5' }}>
          {MEETING_KEYS.map(key => {
            const isEdit = editing[key];
            const val = values[key] || '';
            return (
              <div key={key} className="px-5 py-4">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#5a7a9a' }}>{LABELS[key]}</label>
                {isEdit ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={val}
                      onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="https://teams.microsoft.com/l/meetup-join/..."
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ border: '1.5px solid #2563a8', background: '#f0f4f8', color: '#1a3a5c' }}
                      autoFocus
                    />
                    <button onClick={() => save(key)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#2563a8' }}>
                      <Check size={14} /> Save
                    </button>
                    <button onClick={() => setEditing(prev => ({ ...prev, [key]: false }))} className="px-3 py-2 rounded-lg text-sm border" style={{ color: '#5a7a9a', borderColor: '#c8d8e8' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm truncate max-w-xs" style={{ color: val ? '#1a3a5c' : '#9ab5cc', fontFamily: "'DM Mono', monospace" }}>
                      {val || '— not set —'}
                    </code>
                    <button onClick={() => setEditing(prev => ({ ...prev, [key]: true }))} className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-blue-50 shrink-0" style={{ color: '#1a3a5c', borderColor: '#c8d8e8' }}>
                      {val ? 'Update' : 'Set Link'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#d4e4f0' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#e8eef5', background: '#f0f4f8' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#9b1c1c' }}>Danger Zone</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm mb-4" style={{ color: '#3d5a78' }}>
            Sign out of the admin session. All program data in Supabase remains intact.
          </p>
          {!showReset ? (
            <button onClick={() => setShowReset(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors" style={{ color: '#9b1c1c', borderColor: '#9b1c1c' }}>
              <AlertTriangle size={15} /> Sign Out
            </button>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: '#9b1c1c', background: '#fff8f8' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#9b1c1c' }}>Confirm sign out?</p>
              <div className="flex gap-3">
                <button onClick={handleReset} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#9b1c1c' }}>Yes, Sign Out</button>
                <button onClick={() => setShowReset(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#5a7a9a', borderColor: '#c8d8e8' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
