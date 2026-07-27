import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Match, CheckIn, Participant } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { PageLoader } from '../../components/LoadingSpinner';
import { Plus, Search, ArrowRight, Bell, LogIn, Loader2 } from 'lucide-react';

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 rounded-full" style={{ background: '#e4dfd5' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#1a6b6e' }} />
    </div>
  );
}

export default function MatchesPage() {
  const appUser = useAppUser();
  const { showToast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Match | null>(null);
  const [matchCheckins, setMatchCheckins] = useState<CheckIn[]>([]);
  const [mentorParticipant, setMentorParticipant] = useState<Participant | null>(null);
  const [menteeParticipant, setMenteeParticipant] = useState<Participant | null>(null);

  const [mentors, setMentors] = useState<Participant[]>([]);
  const [mentees, setMentees] = useState<Participant[]>([]);
  const [selMentor, setSelMentor] = useState('');
  const [selMentee, setSelMentee] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [menteeSearch, setMenteeSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const [notesSaving, setNotesSaving] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinRating, setCheckinRating] = useState(0);
  const [loggingCheckin, setLoggingCheckin] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const load = useCallback(async () => {
    try {
      const [matchRes, checkinRes] = await Promise.all([
        supabase.from('matches').select('*').order('matched_date', { ascending: false }),
        supabase.from('checkins').select('*').order('checkin_date', { ascending: false }),
      ]);
      if (matchRes.error) throw matchRes.error;
      if (checkinRes.error) throw checkinRes.error;
      setMatches(matchRes.data || []);
      setCheckins(checkinRes.data || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load matches.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function openCreate() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('status', 'Active')
        .order('name');
      if (error) throw error;
      setMentors((data || []).filter(p => p.role === 'Mentor'));
      setMentees((data || []).filter(p => p.role === 'Mentee'));
      setShowCreate(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load participants.', 'error');
    }
  }

  async function handleCreate() {
    if (!selMentor || !selMentee) return;
    setCreating(true);
    try {
      const mentor = mentors.find(m => m.id === selMentor)!;
      const mentee = mentees.find(m => m.id === selMentee)!;
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('matches').insert({
        mentor_id: mentor.id,
        mentee_id: mentee.id,
        mentor_name: mentor.name,
        mentee_name: mentee.name,
        status: 'Active',
        matched_date: today,
        notes: matchNotes,
        shared_goals: [],
      });
      if (error) throw error;
      showToast('Match created!', 'success');
      setShowCreate(false);
      setSelMentor(''); setSelMentee(''); setMatchNotes('');
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create match.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function openMatch(m: Match) {
    setSelected(m);
    setNotesValue(m.notes || '');
    const mci = checkins.filter(c => c.match_id === m.id);
    setMatchCheckins(mci);
    try {
      const [mentorRes, menteeRes] = await Promise.all([
        supabase.from('participants').select('*').eq('id', m.mentor_id).maybeSingle(),
        supabase.from('participants').select('*').eq('id', m.mentee_id).maybeSingle(),
      ]);
      setMentorParticipant(mentorRes.data);
      setMenteeParticipant(menteeRes.data);
    } catch { /* ignore */ }
  }

  async function saveNotes() {
    if (!selected) return;
    setNotesSaving(true);
    try {
      const { error } = await supabase.from('matches').update({ notes: notesValue }).eq('id', selected.id);
      if (error) throw error;
      showToast('Notes saved.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setNotesSaving(false);
    }
  }

  async function logCheckin() {
    if (!selected) return;
    setLoggingCheckin(true);
    try {
      const matchName = `${selected.mentor_name} → ${selected.mentee_name}`;
      const { error } = await supabase.from('checkins').insert({
        match_id: selected.id,
        match_name: matchName,
        checkin_date: checkinDate,
        notes: checkinNotes,
        completed_by: appUser?.name || 'Admin',
        rating: checkinRating || null,
      });
      if (error) throw error;
      showToast('Check-in logged!', 'success');
      setShowCheckinModal(false);
      setCheckinNotes(''); setCheckinRating(0);
      await load();
      setMatchCheckins(prev => [...prev, {
        id: 'temp',
        match_id: selected.id,
        match_name: matchName,
        checkin_date: checkinDate,
        notes: checkinNotes,
        completed_by: appUser?.name || 'Admin',
        rating: checkinRating,
        created_at: new Date().toISOString(),
      }]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to log check-in.', 'error');
    } finally {
      setLoggingCheckin(false);
    }
  }

  async function sendReminder() {
    if (!selected) return;
    setSendingReminder(true);
    try {
      showToast('Reminder sent! (Email integration required)', 'success');
    } finally {
      setSendingReminder(false);
    }
  }

  const filteredMentors = mentors.filter(m => m.name.toLowerCase().includes(mentorSearch.toLowerCase()));
  const filteredMentees = mentees.filter(m => m.name.toLowerCase().includes(menteeSearch.toLowerCase()));
  const checkinCount = (m: Match) => checkins.filter(c => c.match_id === m.id).length;

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Matches</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>{matches.length} total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#c8922a' }}
        >
          <Plus size={16} /> Create Match
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border" style={{ borderColor: '#e4dfd5' }}>
          <p className="text-base font-semibold mb-2" style={{ color: '#0a1f3c' }}>No matches yet</p>
          <p className="text-sm mb-4" style={{ color: '#6b6560' }}>Create your first mentor-mentee pair to get started.</p>
          <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#c8922a' }}>Create Match</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map(m => {
            const ciCount = checkinCount(m);
            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderColor: '#e4dfd5' }}
                onClick={() => openMatch(m)}
              >
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={m.status} small />
                  <ArrowRight size={15} style={{ color: '#c8c2ba' }} />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    <Avatar name={m.mentor_name} color="#0a1f3c" size="md" />
                    <Avatar name={m.mentee_name} color="#1a6b6e" size="md" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0a1f3c' }}>{m.mentor_name}</p>
                    <p className="text-xs truncate" style={{ color: '#6b6560' }}>with {m.mentee_name}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#6b6560' }}>Check-ins</span>
                    <span className="text-xs font-medium" style={{ color: ciCount >= 4 ? '#1a6b6e' : '#444' }}>{ciCount}/4</span>
                  </div>
                  <ProgressBar value={ciCount} max={4} />
                </div>
                {m.matched_date && <p className="text-xs mt-3" style={{ color: '#9d948b' }}>Matched {m.matched_date}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Match" size="md"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#6b6560', borderColor: '#e4dfd5' }}>Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!selMentor || !selMentee || creating}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: '#c8922a', opacity: (!selMentor || !selMentee || creating) ? 0.5 : 1 }}
            >
              {creating ? <><Loader2 size={14} className="animate-spin" />Creating…</> : 'Create Match'}
            </button>
          </>
        }>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Select Mentor</label>
            <div className="relative mb-1.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9d948b' }} />
              <input value={mentorSearch} onChange={e => setMentorSearch(e.target.value)} placeholder="Search mentors…" className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} />
            </div>
            <select value={selMentor} onChange={e => setSelMentor(e.target.value)} size={4} className="w-full rounded-lg text-sm p-1 outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }}>
              <option value="">— Select a mentor —</option>
              {filteredMentors.map(m => <option key={m.id} value={m.id}>{m.name} · {m.organization || m.city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Select Mentee</label>
            <div className="relative mb-1.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9d948b' }} />
              <input value={menteeSearch} onChange={e => setMenteeSearch(e.target.value)} placeholder="Search mentees…" className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} />
            </div>
            <select value={selMentee} onChange={e => setSelMentee(e.target.value)} size={4} className="w-full rounded-lg text-sm p-1 outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }}>
              <option value="">— Select a mentee —</option>
              {filteredMentees.map(m => <option key={m.id} value={m.id}>{m.name} · {m.organization || m.city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Notes (optional)</label>
            <textarea value={matchNotes} onChange={e => setMatchNotes(e.target.value)} rows={3} placeholder="Match rationale, shared interests…" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} />
          </div>
        </div>
      </Modal>

      {selected && (
        <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: 'rgba(10,31,60,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSelected(null)}>
          <div className="min-h-screen flex items-start justify-center py-8 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e4dfd5', background: '#0a1f3c', borderRadius: '1rem 1rem 0 0' }}>
                <h2 className="font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{selected.mentor_name} → {selected.mentee_name}</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/10"><ArrowRight size={17} style={{ color: 'white', transform: 'rotate(180deg)' }} /></button>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-6">
                {[mentorParticipant, menteeParticipant].map((p, i) => p && (
                  <div key={i} className="rounded-xl border p-4" style={{ borderColor: '#e4dfd5' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: i === 0 ? '#0a1f3c' : '#1a6b6e' }}>{i === 0 ? 'Mentor' : 'Mentee'}</p>
                    <div className="flex items-start gap-3">
                      <Avatar initials={p.initials} color={p.avatar_color} size="md" />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#0a1f3c' }}>{p.name}</p>
                        {p.title && <p className="text-xs" style={{ color: '#444' }}>{p.title}</p>}
                        {p.organization && <p className="text-xs" style={{ color: '#6b6560' }}>{p.organization}</p>}
                        {p.primary_field && <p className="text-xs mt-1" style={{ color: '#6b6560' }}>{p.primary_field}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 pb-4">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Shared Notes</label>
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  onBlur={saveNotes}
                  rows={3}
                  placeholder="Notes about this pairing…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }}
                />
                {notesSaving && <p className="text-xs mt-1" style={{ color: '#6b6560' }}>Saving…</p>}
              </div>

              <div className="px-6 pb-4 flex gap-3">
                <button
                  onClick={() => setShowCheckinModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: '#1a6b6e' }}
                >
                  <LogIn size={15} /> Log Check-In
                </button>
                <button
                  onClick={sendReminder}
                  disabled={sendingReminder}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                  style={{ color: '#0a1f3c', borderColor: '#e4dfd5', background: 'white', opacity: sendingReminder ? 0.6 : 1 }}
                >
                  {sendingReminder ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />} Send Reminder
                </button>
              </div>

              <div className="px-6 pb-6">
                <p className="text-sm font-semibold mb-3" style={{ color: '#0a1f3c' }}>Check-In History ({matchCheckins.length}/4)</p>
                {matchCheckins.length === 0 ? (
                  <p className="text-sm" style={{ color: '#6b6560' }}>No check-ins logged for this pair yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[...matchCheckins].sort((a, b) => b.checkin_date.localeCompare(a.checkin_date)).map(ci => (
                      <div key={ci.id} className="rounded-lg px-4 py-3 border flex items-start gap-3" style={{ borderColor: '#e4dfd5', background: '#faf7f2' }}>
                        {ci.rating > 0 && <span className="text-sm shrink-0 mt-0.5">{'★'.repeat(ci.rating)}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: '#0a1f3c' }}>{ci.checkin_date} · {ci.completed_by}</p>
                          {ci.notes && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6b6560' }}>{ci.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={showCheckinModal} onClose={() => setShowCheckinModal(false)} title="Log Check-In" size="sm"
        footer={
          <>
            <button onClick={() => setShowCheckinModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#6b6560', borderColor: '#e4dfd5' }}>Cancel</button>
            <button onClick={logCheckin} disabled={loggingCheckin} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#1a6b6e', opacity: loggingCheckin ? 0.7 : 1 }}>
              {loggingCheckin ? <Loader2 size={14} className="animate-spin" /> : null}Log Check-In
            </button>
          </>
        }>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Date</label>
            <input type="date" value={checkinDate} onChange={e => setCheckinDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setCheckinRating(n)} className="flex-1 py-2 rounded-lg text-sm transition-all border" style={checkinRating === n ? { background: '#fef3e2', borderColor: '#c8922a' } : { background: '#faf7f2', borderColor: '#e4dfd5' }}>
                  {n}★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Notes</label>
            <textarea value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)} rows={3} placeholder="What did you discuss?" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
