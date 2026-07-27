import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Event, Participant, Rsvp } from '../lib/supabase';
import { CheckCircle, Loader2, Calendar, MapPin, Clock } from 'lucide-react';

function formatDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function RsvpPage() {
  const [params] = useSearchParams();
  const eventId = params.get('event') || '';
  const participantId = params.get('participant') || '';

  const [event, setEvent] = useState<Event | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [existingRsvp, setExistingRsvp] = useState<Rsvp | null>(null);
  const [status, setStatus] = useState<'Going' | 'Not Going' | 'Maybe'>('Going');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !participantId) { setError('Invalid RSVP link.'); setLoading(false); return; }
    async function load() {
      try {
        const [evRes, ptRes, rsvpRes] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
          supabase.from('participants').select('*').eq('id', participantId).maybeSingle(),
          supabase.from('rsvps').select('*').eq('event_id', eventId).eq('participant_id', participantId).maybeSingle(),
        ]);
        if (!evRes.data) { setError('Event not found.'); setLoading(false); return; }
        if (!ptRes.data) { setError('Participant not found.'); setLoading(false); return; }
        setEvent(evRes.data);
        setParticipant(ptRes.data);
        if (rsvpRes.data) {
          setExistingRsvp(rsvpRes.data);
          setStatus(rsvpRes.data.rsvp_status as 'Going' | 'Not Going' | 'Maybe');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load RSVP details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, participantId]);

  async function handleRsvp() {
    if (!event || !participant) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (existingRsvp) {
        const { error } = await supabase.from('rsvps').update({ rsvp_status: status }).eq('id', existingRsvp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rsvps').insert({
          event_id: eventId,
          participant_id: participantId,
          participant_email: participant.email,
          rsvp_date: today,
          rsvp_status: status,
        });
        if (error) throw error;
        await supabase.from('events').update({ rsvp_count: (event.rsvp_count || 0) + 1 }).eq('id', eventId);
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save RSVP.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf7f2' }}>
      <Loader2 size={36} className="animate-spin" style={{ color: '#1a6b6e' }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#faf7f2' }}>
      <div className="max-w-sm text-center bg-white p-8 rounded-2xl border shadow-sm" style={{ borderColor: '#e4dfd5' }}>
        <p className="text-red-600 font-semibold mb-3">{error}</p>
        <Link to="/login" className="text-sm" style={{ color: '#1a6b6e' }}>Go to portal</Link>
      </div>
    </div>
  );

  if (!event || !participant) return null;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#faf7f2' }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-sm border" style={{ borderColor: '#e4dfd5' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#e6f4f4' }}>
            <CheckCircle size={32} style={{ color: '#1a6b6e' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>
            {status === 'Going' ? "You're in!" : status === 'Not Going' ? 'RSVP Updated' : 'RSVP Saved'}
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6b6560' }}>{status === 'Going' ? "We've recorded your RSVP." : `Your response has been updated to: ${status}`}</p>
          <div className="rounded-xl p-4 mb-6 text-left" style={{ background: '#faf7f2', border: '1px solid #e4dfd5' }}>
            <p className="font-semibold text-sm mb-2" style={{ color: '#0a1f3c' }}>{event.name}</p>
            {event.event_date && <p className="text-xs flex items-center gap-1.5" style={{ color: '#6b6560' }}><Calendar size={12} />{formatDate(event.event_date)}</p>}
            {event.event_time && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: '#6b6560' }}><Clock size={12} />{event.event_time}</p>}
            {event.location && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: '#6b6560' }}><MapPin size={12} />{event.location}</p>}
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#0a1f3c' }}
          >
            View All Events
          </Link>
        </div>
      </div>
    );
  }

  const statusOptions: ('Going' | 'Not Going' | 'Maybe')[] = ['Going', 'Not Going', 'Maybe'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#faf7f2' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <p className="font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>WTS · CenCal Mentorship Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e4dfd5' }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: '#f0ebe2', background: '#0a1f3c' }}>
            <p className="text-xs font-medium mb-0.5" style={{ color: '#c8922a' }}>{existingRsvp ? 'Update RSVP' : 'Confirm your RSVP'}</p>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{event.name}</h2>
          </div>

          <div className="px-6 py-5">
            <div className="flex flex-col gap-2 mb-5">
              {event.event_date && <p className="text-sm flex items-center gap-2" style={{ color: '#444' }}><Calendar size={15} style={{ color: '#1a6b6e' }} />{formatDate(event.event_date)}</p>}
              {event.event_time && <p className="text-sm flex items-center gap-2" style={{ color: '#444' }}><Clock size={15} style={{ color: '#1a6b6e' }} />{event.event_time}</p>}
              {event.location && <p className="text-sm flex items-center gap-2" style={{ color: '#444' }}><MapPin size={15} style={{ color: '#1a6b6e' }} />{event.location}</p>}
            </div>

            <p className="text-sm font-semibold mb-1" style={{ color: '#0a1f3c' }}>
              Responding as: <span style={{ color: '#1a6b6e' }}>{participant.name}</span>
            </p>
            <p className="text-xs mb-5" style={{ color: '#6b6560' }}>{participant.email}</p>

            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#0a1f3c' }}>Will you attend?</p>
              <div className="flex gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setStatus(opt)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border"
                    style={status === opt ? {
                      background: opt === 'Going' ? '#e6f4f4' : opt === 'Not Going' ? '#fde8e8' : '#fef3e2',
                      color: opt === 'Going' ? '#1a6b6e' : opt === 'Not Going' ? '#8c3a3a' : '#c8922a',
                      borderColor: opt === 'Going' ? '#1a6b6e' : opt === 'Not Going' ? '#8c3a3a' : '#c8922a',
                    } : { background: '#faf7f2', color: '#6b6560', borderColor: '#e4dfd5' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t" style={{ borderColor: '#f0ebe2', background: '#faf7f2' }}>
            <button
              onClick={handleRsvp}
              disabled={submitting}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
              style={{ background: '#c8922a', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : existingRsvp ? 'Update RSVP' : 'Confirm RSVP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
