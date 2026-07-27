import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Match, CheckIn, Participant } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import { PageLoader } from '../../components/LoadingSpinner';
import { LogIn, Loader2 } from 'lucide-react';

function ProfileField({ label, value }: { label: string; value: unknown }) {
  if (!value || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#6b6560' }}>{label}</p>
      <p className="text-sm" style={{ color: '#2d2d2d', lineHeight: 1.6 }}>{Array.isArray(value) ? value.join(', ') : String(value)}</p>
    </div>
  );
}

export default function MyMatchPage() {
  const appUser = useAppUser();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [partner, setPartner] = useState<Participant | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinRating, setCheckinRating] = useState(0);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!appUser?.participant_id) return;
    async function load() {
      try {
        const pid = appUser!.participant_id;
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .or(`mentor_id.eq.${pid},mentee_id.eq.${pid}`)
          .order('matched_date', { ascending: false });

        const activeMatch = (matchData || []).find(m => m.status === 'Active') || matchData?.[0] || null;
        setMatch(activeMatch);

        if (activeMatch) {
          const partnerId = appUser!.role === 'Mentor' ? activeMatch.mentee_id : activeMatch.mentor_id;
          const [partnerRes, checkinRes] = await Promise.all([
            supabase.from('participants').select('*').eq('id', partnerId).maybeSingle(),
            supabase.from('checkins').select('*').eq('match_id', activeMatch.id).order('checkin_date', { ascending: false }),
          ]);
          setPartner(partnerRes.data);
          setCheckins(checkinRes.data || []);
          setNotes(activeMatch.notes || '');
        }
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load match.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [appUser?.participant_id, appUser?.role, showToast]);

  async function saveNotes() {
    if (!match) return;
    setNotesSaving(true);
    try {
      const { error } = await supabase.from('matches').update({ notes }).eq('id', match.id);
      if (error) throw error;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setNotesSaving(false);
    }
  }

  async function logCheckin() {
    if (!match) return;
    setLogging(true);
    try {
      const matchName = `${match.mentor_name} → ${match.mentee_name}`;
      const { error } = await supabase.from('checkins').insert({
        match_id: match.id,
        match_name: matchName,
        checkin_date: checkinDate,
        notes: checkinNotes,
        completed_by: appUser?.name || '',
        rating: checkinRating || null,
      });
      if (error) throw error;
      showToast('Check-in logged!', 'success');
      setShowCheckin(false);
      setCheckinNotes(''); setCheckinRating(0);
      const { data } = await supabase.from('checkins').select('*').eq('match_id', match.id).order('checkin_date', { ascending: false });
      setCheckins(data || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to log check-in.', 'error');
    } finally {
      setLogging(false);
    }
  }

  if (loading) return <PageLoader />;

  const partnerLabel = appUser?.role === 'Mentor' ? 'Mentee' : 'Mentor';

  if (!match || !partner) {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>My Match</h1>
        <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: '#e4dfd5' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#f0ebe2' }}>
            <span style={{ fontSize: 28 }}>&#8987;</span>
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Your match is being arranged</h2>
          <p className="text-sm" style={{ color: '#6b6560', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
            {appUser?.role === 'Mentor'
              ? "You're confirmed as a mentor — we're working on finding your match. We'll notify you by email when you're paired."
              : "Your match is being arranged. You'll receive an email introduction as soon as you're paired."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>My Match</h1>

      <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: '#e4dfd5' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#6b6560' }}>Your {partnerLabel}</p>
        <div className="flex items-start gap-4 mb-5">
          <Avatar initials={partner.initials} color={partner.avatar_color} size="xl" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{partner.name}</h2>
            {partner.title && <p className="text-sm mt-0.5" style={{ color: '#444' }}>{partner.title}</p>}
            {partner.organization && <p className="text-sm" style={{ color: '#6b6560' }}>{partner.organization}</p>}
            {partner.city && <p className="text-xs mt-1" style={{ color: '#9d948b' }}>{partner.city}</p>}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-0">
          <div>
            <ProfileField label="Career Stage" value={partner.career_stage} />
            <ProfileField label="Primary Field" value={partner.primary_field} />
            <ProfileField label={appUser?.role === 'Mentor' ? 'Areas Seeking Guidance' : 'Areas Offering Guidance'} value={partner.guidance_areas} />
            <ProfileField label="Mentorship Goals" value={partner.goals} />
          </div>
          <div>
            <ProfileField label="Communication Style" value={partner.communication_style} />
            <ProfileField label="Meeting Preference" value={partner.meeting_format} />
            <ProfileField label="Availability" value={partner.availability} />
          </div>
        </div>
        {partner.goals_text && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f0ebe2' }}>
            <ProfileField label="Program Goals" value={partner.goals_text} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: '#e4dfd5' }}>
        <h3 className="font-semibold mb-3" style={{ color: '#0a1f3c' }}>Shared Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={4}
          placeholder="Use this space for shared goals, action items, or notes from your meetings…"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
          style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2', color: '#0a1f3c' }}
          onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
        />
        {notesSaving && <p className="text-xs mt-1" style={{ color: '#6b6560' }}>Saving…</p>}
      </div>

      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#e4dfd5' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold" style={{ color: '#0a1f3c' }}>Check-In History</h3>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{checkins.length}/4 completed</p>
          </div>
          <button
            onClick={() => setShowCheckin(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#1a6b6e' }}
          >
            <LogIn size={14} /> Log Check-In
          </button>
        </div>

        <div className="h-1.5 rounded-full mb-5" style={{ background: '#e4dfd5' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min((checkins.length / 4) * 100, 100)}%`, background: '#1a6b6e' }} />
        </div>

        {checkins.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#6b6560' }}>No check-ins logged yet. Log your first one after your initial meeting!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {checkins.map(ci => (
              <div key={ci.id} className="rounded-lg border px-4 py-3 flex items-start gap-3" style={{ borderColor: '#e4dfd5', background: '#faf7f2' }}>
                {ci.rating > 0 && <span className="text-base shrink-0 mt-0.5">{'★'.repeat(ci.rating)}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#0a1f3c' }}>{ci.checkin_date} · {ci.completed_by}</p>
                  {ci.notes && <p className="text-sm" style={{ color: '#6b6560', lineHeight: 1.6 }}>{ci.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCheckin} onClose={() => setShowCheckin(false)} title="Log Check-In" size="sm"
        footer={
          <>
            <button onClick={() => setShowCheckin(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#6b6560', borderColor: '#e4dfd5' }}>Cancel</button>
            <button onClick={logCheckin} disabled={logging} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#1a6b6e', opacity: logging ? 0.7 : 1 }}>
              {logging && <Loader2 size={14} className="animate-spin" />}Log Check-In
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
                <button key={n} onClick={() => setCheckinRating(n)} className="flex-1 py-2 rounded-lg text-xs transition-all border" style={checkinRating === n ? { background: '#fef3e2', borderColor: '#c8922a' } : { background: '#faf7f2', borderColor: '#e4dfd5' }}>
                  {n}★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Notes</label>
            <textarea value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)} rows={3} placeholder="What did you discuss? What were the key takeaways?" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
