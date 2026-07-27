import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Event, Rsvp } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { PageLoader } from '../../components/LoadingSpinner';
import { Plus, Calendar, Clock, MapPin, Users, CreditCard as Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../../lib/constants';

interface EventFormData {
  name: string;
  event_date: string;
  event_time: string;
  location: string;
  description: string;
  event_type: string;
  audience: string;
}

const EMPTY_FORM: EventFormData = { name: '', event_date: '', event_time: '', location: '', description: '', event_type: 'Other', audience: 'Everyone' };

function EventForm({ value, onChange }: { value: EventFormData; onChange: (v: EventFormData) => void }) {
  function field(key: keyof EventFormData, label: string, type?: string) {
    return (
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>{label}</label>
        <input type={type || 'text'} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #c8d8e8', background: '#f0f4f8', color: '#1a3a5c' }}
          onFocus={e => (e.target.style.borderColor = '#1a6b6e')} onBlur={e => (e.target.style.borderColor = '#c8d8e8')} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {field('name', 'Event Name')}
      <div className="grid grid-cols-2 gap-3">
        {field('event_date', 'Date', 'date')}
        {field('event_time', 'Time (e.g. 6:00 PM)')}
      </div>
      {field('location', 'Location')}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>Description</label>
        <textarea value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #c8d8e8', background: '#f0f4f8' }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>Type</label>
          <select value={value.event_type} onChange={e => onChange({ ...value, event_type: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #c8d8e8', background: '#f0f4f8' }}>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a3a5c' }}>Audience</label>
          <select value={value.audience} onChange={e => onChange({ ...value, audience: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #c8d8e8', background: '#f0f4f8' }}>
            {['Everyone', 'Mentors', 'Mentees', 'Admin Only'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function formatEventDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventsPage() {
  const appUser = useAppUser();
  const { showToast } = useToast();
  const isAdmin = appUser?.is_admin ?? false;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showRsvps, setShowRsvps] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [userRsvps, setUserRsvps] = useState<Record<string, { id: string; status: string }>>({});
  const [rsvpSaving, setRsvpSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: evData, error: evError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (evError) throw evError;
      setEvents(evData || []);

      if (appUser?.participant_id) {
        const { data: rsvpData } = await supabase
          .from('rsvps')
          .select('*')
          .eq('participant_id', appUser.participant_id);
        const map: Record<string, { id: string; status: string }> = {};
        (rsvpData || []).forEach(r => { map[r.event_id] = { id: r.id, status: r.rsvp_status }; });
        setUserRsvps(map);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, appUser?.participant_id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form.name || !form.event_date) { showToast('Name and date are required.', 'warning'); return; }
    setSaving(true);
    try {
      if (editEvent) {
        const { error } = await supabase.from('events').update({
          name: form.name,
          event_date: form.event_date,
          event_time: form.event_time,
          location: form.location,
          description: form.description,
          event_type: form.event_type,
          audience: form.audience,
        }).eq('id', editEvent.id);
        if (error) throw error;
        showToast('Event updated.', 'success');
        setEditEvent(null);
      } else {
        const { error } = await supabase.from('events').insert({
          name: form.name,
          event_date: form.event_date,
          event_time: form.event_time,
          location: form.location,
          description: form.description,
          event_type: form.event_type,
          audience: form.audience,
          rsvp_count: 0,
        });
        if (error) throw error;
        showToast('Event created.', 'success');
        setShowCreate(false);
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ev: Event) {
    if (!confirm(`Delete "${ev.name}"?`)) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', ev.id);
      if (error) throw error;
      showToast('Event deleted.', 'success');
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  }

  async function openRsvps(ev: Event) {
    setShowRsvps(ev);
    try {
      const { data, error } = await supabase.from('rsvps').select('*').eq('event_id', ev.id);
      if (error) throw error;
      setRsvps(data || []);
    } catch { setRsvps([]); }
  }

  async function handleRsvp(ev: Event, status: string) {
    if (!appUser?.participant_id) return;
    setRsvpSaving(ev.id);
    try {
      const existing = userRsvps[ev.id];
      const today = new Date().toISOString().split('T')[0];
      if (existing) {
        const { error } = await supabase.from('rsvps').update({ rsvp_status: status }).eq('id', existing.id);
        if (error) throw error;
        setUserRsvps(prev => ({ ...prev, [ev.id]: { id: existing.id, status } }));
      } else {
        const { data, error } = await supabase.from('rsvps').insert({
          event_id: ev.id,
          participant_id: appUser.participant_id,
          participant_email: appUser.email,
          rsvp_date: today,
          rsvp_status: status,
        }).select().single();
        if (error) throw error;
        await supabase.from('events').update({ rsvp_count: (ev.rsvp_count || 0) + 1 }).eq('id', ev.id);
        setUserRsvps(prev => ({ ...prev, [ev.id]: { id: data.id, status } }));
      }
      showToast(`RSVP saved: ${status}`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'RSVP failed.', 'error');
    } finally {
      setRsvpSaving(null);
    }
  }

  const visibleEvents = events.filter(ev => {
    if (isAdmin) return true;
    if (ev.audience === 'Admin Only') return false;
    if (ev.audience === 'Mentors' && appUser?.role !== 'Mentor') return false;
    if (ev.audience === 'Mentees' && appUser?.role !== 'Mentee') return false;
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Events</h1>
          <p className="text-sm mt-0.5" style={{ color: '#5a7a9a' }}>{visibleEvents.length} upcoming</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#2563a8' }}>
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleEvents.map(ev => {
          const typeColor = (EVENT_TYPE_COLORS as Record<string, string>)[ev.event_type] || '#4a5568';
          const myRsvp = userRsvps[ev.id];
          return (
            <div key={ev.id} className="bg-white rounded-xl border overflow-hidden flex flex-col hover:shadow-md transition-shadow" style={{ borderColor: '#c8d8e8' }}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: typeColor }}>
                <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">{ev.event_type}</span>
                <span className="text-xs text-white/70">{ev.audience}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>{ev.name}</h3>
                <div className="flex flex-col gap-1.5 mb-3">
                  {ev.event_date && <p className="text-xs flex items-center gap-1.5" style={{ color: '#444' }}><Calendar size={12} style={{ color: typeColor }} />{formatEventDate(ev.event_date)}</p>}
                  {ev.event_time && <p className="text-xs flex items-center gap-1.5" style={{ color: '#444' }}><Clock size={12} style={{ color: typeColor }} />{ev.event_time}</p>}
                  {ev.location && <p className="text-xs flex items-center gap-1.5" style={{ color: '#444' }}><MapPin size={12} style={{ color: typeColor }} />{ev.location}</p>}
                </div>
                {ev.description && <p className="text-xs mb-3 line-clamp-3" style={{ color: '#5a7a9a', lineHeight: 1.6 }}>{ev.description}</p>}
                <div className="flex items-center gap-1.5 mt-auto pt-3 border-t" style={{ borderColor: '#e8eef5' }}>
                  <Users size={12} style={{ color: '#9d948b' }} />
                  <span className="text-xs" style={{ color: '#5a7a9a' }}>{ev.rsvp_count || 0} RSVPs</span>
                </div>
              </div>
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {isAdmin ? (
                  <>
                    <button onClick={() => openRsvps(ev)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50" style={{ color: '#1a6b6e', borderColor: '#c8d8e8' }}>
                      <Eye size={12} /> View RSVPs
                    </button>
                    <button onClick={() => { setEditEvent(ev); setForm({ name: ev.name, event_date: ev.event_date || '', event_time: ev.event_time || '', location: ev.location || '', description: ev.description || '', event_type: ev.event_type || 'Other', audience: ev.audience || 'Everyone' }); }} className="p-1.5 rounded-lg border hover:bg-gray-50" style={{ color: '#5a7a9a', borderColor: '#c8d8e8' }}><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(ev)} className="p-1.5 rounded-lg border hover:bg-red-50" style={{ color: '#8c3a3a', borderColor: '#c8d8e8' }}><Trash2 size={13} /></button>
                  </>
                ) : (
                  <div className="w-full">
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#5a7a9a' }}>Will you attend?</p>
                    <div className="flex gap-1.5">
                      {(['Going', 'Maybe', 'Not Going'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => handleRsvp(ev, s)}
                          disabled={rsvpSaving === ev.id}
                          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border"
                          style={myRsvp?.status === s
                            ? { background: s === 'Going' ? '#e6f4f4' : s === 'Not Going' ? '#fde8e8' : '#fef3e2', color: s === 'Going' ? '#1a6b6e' : s === 'Not Going' ? '#8c3a3a' : '#2563a8', borderColor: s === 'Going' ? '#1a6b6e' : s === 'Not Going' ? '#8c3a3a' : '#2563a8' }
                            : { background: '#f0f4f8', color: '#5a7a9a', borderColor: '#c8d8e8' }
                          }
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {myRsvp && <p className="text-xs mt-1.5" style={{ color: '#1a6b6e' }}>You responded: {myRsvp.status}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Event" size="md"
        footer={<><button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#5a7a9a', borderColor: '#c8d8e8' }}>Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#2563a8', opacity: saving ? 0.7 : 1 }}>{saving && <Loader2 size={14} className="animate-spin" />}Create Event</button></>}>
        <EventForm value={form} onChange={setForm} />
      </Modal>

      <Modal open={!!editEvent} onClose={() => setEditEvent(null)} title="Edit Event" size="md"
        footer={<><button onClick={() => setEditEvent(null)} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#5a7a9a', borderColor: '#c8d8e8' }}>Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#2563a8', opacity: saving ? 0.7 : 1 }}>{saving && <Loader2 size={14} className="animate-spin" />}Save Changes</button></>}>
        <EventForm value={form} onChange={setForm} />
      </Modal>

      <Modal open={!!showRsvps} onClose={() => setShowRsvps(null)} title={`RSVPs — ${showRsvps?.name}`} size="md">
        {rsvps.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: '#5a7a9a' }}>No RSVPs yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rsvps.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#e8eef5' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1a3a5c' }}>{r.participant_email}</p>
                  <p className="text-xs" style={{ color: '#5a7a9a' }}>{r.rsvp_date}</p>
                </div>
                <StatusBadge status={r.rsvp_status} small />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
