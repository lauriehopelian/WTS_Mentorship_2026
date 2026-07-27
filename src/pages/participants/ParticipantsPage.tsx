import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import { PageLoader } from '../../components/LoadingSpinner';
import { X, Search, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { FIELD_OPTIONS, CAREER_STAGES, COMM_STYLES, CADENCE_OPTIONS, AVAILABILITY_OPTIONS } from '../../lib/constants';
import type { Participant } from '../../lib/supabase';

const FILTER_TABS = ['All', 'Mentors', 'Mentees', 'Pending', 'Alumni'];

function DrawerField({ label, value }: { label: string; value: unknown }) {
  if (!value || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>{label}</p>
      <p className="text-sm" style={{ color: '#2d2d2d' }}>{Array.isArray(value) ? value.join(', ') : String(value)}</p>
    </div>
  );
}

function EditForm({ participant, onSave, onClose }: { participant: Participant; onSave: () => void; onClose: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(participant.name);
  const [phone, setPhone] = useState(participant.phone);
  const [title, setTitle] = useState(participant.title);
  const [org, setOrg] = useState(participant.organization);
  const [city, setCity] = useState(participant.city);
  const [status, setStatus] = useState(participant.status);
  const [careerStage, setCareerStage] = useState(participant.career_stage);
  const [primaryField, setPrimaryField] = useState(participant.primary_field);
  const [commStyle, setCommStyle] = useState(participant.communication_style);
  const [meetingPref, setMeetingPref] = useState(participant.meeting_format);
  const [availability, setAvailability] = useState(participant.availability);
  const [cadence, setCadence] = useState(participant.cadence);
  const [saving, setSaving] = useState(false);

  function inp(value: string, onChange: (v: string) => void, placeholder?: string, disabled?: boolean) {
    return (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
        style={{ background: disabled ? '#f0ebe2' : '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c', opacity: disabled ? 0.6 : 1 }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = '#1a6b6e'; }}
        onBlur={e => { e.target.style.borderColor = '#e4dfd5'; }}
      />
    );
  }

  function sel(options: string[], value: string, onChange: (v: string) => void, placeholder?: string) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('participants').update({
      name, phone, title, organization: org, city, status,
      career_stage: careerStage, primary_field: primaryField,
      communication_style: commStyle, meeting_format: meetingPref,
      availability, cadence,
    }).eq('id', participant.id);
    if (error) {
      showToast('Failed to save changes.', 'error');
    } else {
      showToast('Participant updated.', 'success');
      onSave();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Full Name</p>{inp(name, setName)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Email</p>{inp(participant.email, () => {}, '', true)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Phone</p>{inp(phone, setPhone)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Title</p>{inp(title, setTitle)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Organization</p>{inp(org, setOrg)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>City</p>{inp(city, setCity)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Status</p>{sel(['Pending', 'Active', 'Alumni'], status, setStatus)}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Career Stage</p>{sel(CAREER_STAGES, careerStage, setCareerStage, 'Select…')}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Primary Field</p>{sel(FIELD_OPTIONS, primaryField, setPrimaryField, 'Select…')}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Meeting Pref.</p>{sel(['Virtual', 'In-Person', 'Either'], meetingPref, setMeetingPref, 'Select…')}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Availability</p>{sel(AVAILABILITY_OPTIONS, availability, setAvailability, 'Select…')}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Comm. Style</p>{sel(COMM_STYLES, commStyle, setCommStyle, 'Select…')}</div>
        <div><p className="text-xs font-semibold mb-1" style={{ color: '#6b6560' }}>Cadence</p>{sel(CADENCE_OPTIONS, cadence, setCadence, 'Select…')}</div>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors" style={{ color: '#6b6560', borderColor: '#e4dfd5' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0a1f3c', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default function ParticipantsPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const appUser = useAppUser();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [editing, setEditing] = useState(false);
  const [approving, setApproving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    setParticipants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = participants.filter(p => {
    const matchTab = filter === 'All' ? true
      : filter === 'Mentors' ? p.role === 'Mentor'
      : filter === 'Mentees' ? p.role === 'Mentee'
      : filter === 'Pending' ? p.status === 'Pending'
      : p.status === 'Alumni';
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.organization.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  async function handleApprove(p: Participant) {
    setApproving(true);
    const { error } = await supabase.from('participants').update({ status: 'Active' }).eq('id', p.id);
    if (error) {
      showToast('Approval failed.', 'error');
    } else {
      showToast(`${p.name} approved!`, 'success');
      await load();
      setSelected(prev => prev?.id === p.id ? { ...prev, status: 'Active' } : prev);
    }
    setApproving(false);
  }

  if (loading) return <PageLoader />;

  const pendingCount = participants.filter(p => p.status === 'Pending').length;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Participants</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>{participants.length} total</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 bg-white rounded-xl border p-1" style={{ borderColor: '#e4dfd5' }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={filter === tab ? { background: '#0a1f3c', color: 'white' } : { color: '#6b6560' }}
            >
              {tab}
              {tab === 'Pending' && pendingCount > 0 &&
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: filter === 'Pending' ? 'rgba(255,255,255,0.2)' : '#fef3e2', color: filter === 'Pending' ? 'white' : '#c8922a' }}>
                  {pendingCount}
                </span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9d948b' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search participants…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'white', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}
            onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
            onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e4dfd5' }}>
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: '#6b6560' }}>No participants found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left" style={{ background: '#faf7f2', borderBottom: '1px solid #e4dfd5' }}>
                {['Name', 'Role', 'Career Stage', 'Organization', 'City', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b6560' }}>{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-amber-50/50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ebe2' : 'none' }}
                  onClick={() => { setSelected(p); setEditing(false); }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={p.initials} color={p.avatar_color} size="sm" />
                      <span className="text-sm font-medium" style={{ color: '#0a1f3c' }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#444' }}>{p.role}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#444' }}>{p.career_stage || '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#444' }}>{p.organization || '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#444' }}>{p.city || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} small /></td>
                  <td className="px-4 py-3 text-right"><ChevronRight size={16} style={{ color: '#c8c2ba' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => { setSelected(null); setEditing(false); }}>
          <div className="flex-1" />
          <div
            className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto flex flex-col"
            style={{ borderLeft: '1px solid #e4dfd5' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#e4dfd5' }}>
              <h2 className="font-semibold text-base" style={{ color: '#0a1f3c' }}>Participant Profile</h2>
              <div className="flex items-center gap-2">
                {!editing && appUser?.is_admin && <button onClick={() => setEditing(true)} className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ color: '#0a1f3c', borderColor: '#e4dfd5' }}>Edit</button>}
                <button onClick={() => { setSelected(null); setEditing(false); }} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={17} /></button>
              </div>
            </div>

            <div className="flex-1 px-5 py-5">
              {!editing ? (
                <>
                  <div className="flex items-start gap-4 mb-5">
                    <Avatar initials={selected.initials} color={selected.avatar_color} size="lg" />
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{selected.name}</h3>
                      {selected.title && <p className="text-sm" style={{ color: '#444' }}>{selected.title}</p>}
                      {selected.organization && <p className="text-sm" style={{ color: '#6b6560' }}>{selected.organization}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={selected.status} />
                        <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: '#1a6b6e', color: '#1a6b6e', background: '#e6f4f4' }}>{selected.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b" style={{ borderColor: '#f0ebe2' }}>
                    <DrawerField label="Email" value={selected.email} />
                    <DrawerField label="Phone" value={selected.phone} />
                    <DrawerField label="City" value={selected.city} />
                  </div>

                  <div className="mb-4 pb-4 border-b" style={{ borderColor: '#f0ebe2' }}>
                    <DrawerField label="Career Stage" value={selected.career_stage} />
                    <DrawerField label="Primary Field" value={selected.primary_field} />
                    <DrawerField label="Guidance Areas" value={selected.guidance_areas} />
                    <DrawerField label="Mentorship Goals" value={selected.goals} />
                  </div>

                  <div className="mb-4 pb-4 border-b" style={{ borderColor: '#f0ebe2' }}>
                    <DrawerField label="Communication Style" value={selected.communication_style} />
                    <DrawerField label="Meeting Preference" value={selected.meeting_format} />
                    <DrawerField label="Availability" value={selected.availability} />
                    <DrawerField label="Between-Meeting Cadence" value={selected.cadence} />
                    <DrawerField label="Open to Cross-Discipline" value={selected.cross_discipline ? 'Yes' : 'No'} />
                  </div>

                  {selected.goals_text && <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>Program Goals</p><p className="text-sm" style={{ color: '#2d2d2d', lineHeight: 1.6 }}>{selected.goals_text}</p></div>}
                  {selected.topics_text && <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>Topics to Discuss</p><p className="text-sm" style={{ color: '#2d2d2d', lineHeight: 1.6 }}>{selected.topics_text}</p></div>}
                  {selected.match_notes && <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6b6560' }}>Match Notes</p><p className="text-sm" style={{ color: '#2d2d2d', lineHeight: 1.6 }}>{selected.match_notes}</p></div>}

                  {selected.status === 'Pending' && appUser?.is_admin && (
                    <div className="mt-6">
                      <button
                        onClick={() => handleApprove(selected)}
                        disabled={approving}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
                        style={{ background: '#1a6b6e', opacity: approving ? 0.7 : 1 }}
                      >
                        {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        {approving ? 'Approving…' : 'Approve Participant'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EditForm
                  participant={selected}
                  onSave={async () => { await load(); setEditing(false); setSelected(prev => participants.find(p => p.id === prev?.id) || prev); }}
                  onClose={() => setEditing(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
