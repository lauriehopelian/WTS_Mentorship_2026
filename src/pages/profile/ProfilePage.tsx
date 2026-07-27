import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import Avatar from '../../components/Avatar';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { FIELD_OPTIONS, GOAL_OPTIONS, CAREER_STAGES, COMM_STYLES, CADENCE_OPTIONS, AVAILABILITY_OPTIONS } from '../../lib/constants';
import { PageLoader } from '../../components/LoadingSpinner';
import type { Participant } from '../../lib/supabase';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6b6560' }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled }: { value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
      style={{ background: disabled ? '#f0ebe2' : '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c', opacity: disabled ? 0.6 : 1 }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = '#1a6b6e'; }}
      onBlur={e => { e.target.style.borderColor = '#e4dfd5'; }}
    />
  );
}

function Sel({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}>
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function MultiCheck({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  }
  return (
    <div className="flex flex-col gap-1.5">
      {options.map(opt => {
        const checked = value.includes(opt);
        return (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all" style={{ borderColor: checked ? '#1a6b6e' : '#c8c2ba', background: checked ? '#1a6b6e' : 'transparent' }} onClick={() => toggle(opt)}>
              {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="text-sm" style={{ color: '#2d2d2d' }} onClick={() => toggle(opt)}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function ChangePasswordSection() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    if (newPassword !== confirm) { showToast('Passwords do not match.', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { showToast('Failed to update password.', 'error'); return; }
    showToast('Password updated!', 'success');
    setNewPassword('');
    setConfirm('');
    setOpen(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: '#e4dfd5' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={16} style={{ color: '#1a6b6e' }} />
          <h2 className="font-semibold" style={{ color: '#0a1f3c' }}>Password</h2>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-teal-50"
            style={{ color: '#1a6b6e', borderColor: '#1a6b6e' }}
          >
            Change Password
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6b6560' }}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full rounded-lg px-3 py-2 pr-9 text-sm outline-none transition-all"
                style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}
                onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
                onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#5a7a9a' }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6b6560' }}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full rounded-lg px-3 py-2 pr-9 text-sm outline-none transition-all"
                style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}
                onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
                onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#5a7a9a' }}>
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: '#1a6b6e', opacity: saving ? 0.7 : 1 }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setNewPassword(''); setConfirm(''); }}
              className="px-5 py-2 rounded-lg text-sm font-semibold border"
              style={{ color: '#5a7a9a', borderColor: '#c8c2ba' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const appUser = useAppUser();
  const { showToast } = useToast();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [org, setOrg] = useState('');
  const [city, setCity] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [primaryField, setPrimaryField] = useState('');
  const [guidanceAreas, setGuidanceAreas] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState('');
  const [meetingPref, setMeetingPref] = useState('');
  const [availability, setAvailability] = useState('');
  const [cadence, setCadence] = useState('');
  const [crossDisc, setCrossDisc] = useState('No');
  const [goalsText, setGoalsText] = useState('');
  const [topicsText, setTopicsText] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appUser?.participant_id) return;
    supabase.from('participants').select('*').eq('id', appUser.participant_id).maybeSingle().then(({ data }) => {
      if (data) {
        setParticipant(data);
        setPhone(data.phone || '');
        setTitle(data.title || '');
        setOrg(data.organization || '');
        setCity(data.city || '');
        setCareerStage(data.career_stage || '');
        setPrimaryField(data.primary_field || '');
        setGuidanceAreas(data.guidance_areas || []);
        setGoals(data.goals || []);
        setCommStyle(data.communication_style || '');
        setMeetingPref(data.meeting_format || '');
        setAvailability(data.availability || '');
        setCadence(data.cadence || '');
        setCrossDisc(data.cross_discipline ? 'Yes' : 'No');
        setGoalsText(data.goals_text || '');
        setTopicsText(data.topics_text || '');
        setMatchNotes(data.match_notes || '');
      }
      setLoadingProfile(false);
    });
  }, [appUser?.participant_id]);

  async function handleSave() {
    if (!participant) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('participants').update({
        phone, title, organization: org, city,
        career_stage: careerStage,
        primary_field: primaryField,
        guidance_areas: guidanceAreas,
        goals,
        communication_style: commStyle,
        meeting_format: meetingPref,
        availability,
        cadence,
        cross_discipline: crossDisc === 'Yes',
        goals_text: goalsText,
        topics_text: topicsText,
        match_notes: matchNotes,
      }).eq('id', participant.id);
      if (error) throw error;
      showToast('Profile saved!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile || !participant) return <PageLoader />;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-start gap-4 mb-8">
        <Avatar initials={participant.initials} color={participant.avatar_color} size="xl" />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{participant.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: '#444' }}>{appUser?.email}</p>
          <span className="inline-block text-xs px-2.5 py-1 rounded-full mt-2 font-medium" style={{ background: '#e6f4f4', color: '#1a6b6e', border: '1px solid #1a6b6e' }}>{participant.role}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: '#e4dfd5' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#0a1f3c' }}>Contact & Professional Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email"><Input value={appUser?.email || ''} disabled /></Field>
          <Field label="Phone"><Input value={phone} onChange={setPhone} placeholder="(559) 555-0100" /></Field>
          <Field label="Title / Role"><Input value={title} onChange={setTitle} placeholder="Project Engineer" /></Field>
          <Field label="Organization"><Input value={org} onChange={setOrg} placeholder="Caltrans District 6" /></Field>
          <Field label="City"><Input value={city} onChange={setCity} placeholder="Fresno" /></Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: '#e4dfd5' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#0a1f3c' }}>Professional Focus</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Career Stage"><Sel options={CAREER_STAGES} value={careerStage} onChange={setCareerStage} /></Field>
          <Field label="Primary Field"><Sel options={FIELD_OPTIONS} value={primaryField} onChange={setPrimaryField} /></Field>
        </div>
        <div className="mt-4">
          <Field label={participant.role === 'Mentor' ? 'Areas Offering Guidance' : 'Areas Seeking Guidance'}>
            <MultiCheck options={FIELD_OPTIONS} value={guidanceAreas} onChange={setGuidanceAreas} />
          </Field>
        </div>
        <div className="mt-4"><Field label="Mentorship Goals (up to 3)"><MultiCheck options={GOAL_OPTIONS} value={goals} onChange={v => v.length <= 3 && setGoals(v)} /></Field></div>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: '#e4dfd5' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#0a1f3c' }}>Communication & Preferences</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Communication Style"><Sel options={COMM_STYLES} value={commStyle} onChange={setCommStyle} /></Field>
          <Field label="Meeting Preference"><Sel options={['Virtual', 'In-Person', 'Either']} value={meetingPref} onChange={setMeetingPref} /></Field>
          <Field label="Availability"><Sel options={AVAILABILITY_OPTIONS} value={availability} onChange={setAvailability} /></Field>
          <Field label="Between-Meeting Cadence"><Sel options={CADENCE_OPTIONS} value={cadence} onChange={setCadence} /></Field>
          <Field label="Cross-Discipline Match"><Sel options={['Yes', 'No', 'Maybe']} value={crossDisc} onChange={setCrossDisc} /></Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: '#e4dfd5' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#0a1f3c' }}>Open-Ended Responses</h2>
        <div className="flex flex-col gap-4">
          <Field label="What are you hoping to get from this program?">
            <textarea value={goalsText} onChange={e => setGoalsText(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} onFocus={e => (e.target.style.borderColor = '#1a6b6e')} onBlur={e => (e.target.style.borderColor = '#e4dfd5')} />
          </Field>
          <Field label="Topics or challenges you'd like to discuss">
            <textarea value={topicsText} onChange={e => setTopicsText(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} onFocus={e => (e.target.style.borderColor = '#1a6b6e')} onBlur={e => (e.target.style.borderColor = '#e4dfd5')} />
          </Field>
          <Field label="Notes to help with matching">
            <textarea value={matchNotes} onChange={e => setMatchNotes(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} onFocus={e => (e.target.style.borderColor = '#1a6b6e')} onBlur={e => (e.target.style.borderColor = '#e4dfd5')} />
          </Field>
        </div>
      </div>

      <ChangePasswordSection />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
        style={{ background: '#c8922a', opacity: saving ? 0.7 : 1 }}
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  );
}
