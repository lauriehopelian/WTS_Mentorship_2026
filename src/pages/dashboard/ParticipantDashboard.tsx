import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { PageLoader } from '../../components/LoadingSpinner';
import Avatar from '../../components/Avatar';
import { Calendar, Clock, MapPin, Pin, ArrowRight, Heart, Video } from 'lucide-react';
import type { Participant, Match, Event, Announcement } from '../../lib/supabase';
import { EVENT_TYPE_COLORS } from '../../lib/constants';
import { getNextFirstTuesday, formatMeetingDate, daysUntil } from '../../lib/meetingUtils';

function formatDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysFromToday(d?: string): number | null {
  if (!d) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dt = new Date(d + 'T00:00:00');
  return Math.round((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const appUser = useAppUser();
  const firstName = appUser?.name?.split(' ')[0] || '';

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [partner, setPartner] = useState<Participant | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [teamsLink, setTeamsLink] = useState('');

  const nextMeeting = getNextFirstTuesday();
  const meetingDays = daysUntil(nextMeeting);

  useEffect(() => {
    if (!appUser?.participant_id) return;
    async function load() {
      const participantId = appUser!.participant_id;
      const role = appUser!.role;
      const today = new Date().toISOString().split('T')[0];

      const [matchesRes, eventsRes, announcementsRes, configRes] = await Promise.all([
        supabase.from('matches').select('*').or(`mentor_id.eq.${participantId},mentee_id.eq.${participantId}`),
        supabase.from('events').select('*').gte('event_date', today).order('event_date', { ascending: true }),
        supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('app_config').select('key, value').eq('key', 'wts_teams_link').maybeSingle(),
      ]);

      const activeMatch = (matchesRes.data || []).find(m => m.status === 'Active') || (matchesRes.data || [])[0] || null;
      setMatch(activeMatch);

      if (activeMatch) {
        const partnerId = role === 'Mentor' ? activeMatch.mentee_id : activeMatch.mentor_id;
        const { data: partnerData } = await supabase.from('participants').select('*').eq('id', partnerId).maybeSingle();
        setPartner(partnerData);
      }

      const upcoming = (eventsRes.data || [])
        .filter(e => {
          if (e.audience === 'Admin Only') return false;
          if (e.audience === 'Mentors' && role !== 'Mentor') return false;
          if (e.audience === 'Mentees' && role !== 'Mentee') return false;
          return true;
        })
        .slice(0, 4);
      setEvents(upcoming);

      const visible = (announcementsRes.data || []).find(a => {
        if (a.audience === 'Everyone') return true;
        if (a.audience === 'Mentors' && role === 'Mentor') return true;
        if (a.audience === 'Mentees' && role === 'Mentee') return true;
        return false;
      }) || null;
      setAnnouncement(visible);
      setTeamsLink(configRes.data?.value || '');
      setLoading(false);
    }
    load();
  }, [appUser?.participant_id]);

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-7 rounded-2xl px-7 py-6" style={{ background: '#0f2744' }}>
        <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>2024–25 Mentorship Program</p>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome back, {firstName}!</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
          You're participating as a <span style={{ color: '#4db8c8', fontWeight: 600 }}>{appUser?.role}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <div className="md:col-span-2 bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: '#1a3a5c' }}>
              <Heart size={15} style={{ color: '#9b1c1c' }} /> My Match
            </h2>
            {match && <button onClick={() => navigate('/my-match')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563a8' }}>View <ArrowRight size={11} /></button>}
          </div>

          {!match ? (
            <div className="rounded-xl px-4 py-4" style={{ background: '#f0f4f8', border: '1px solid #d4e4f0' }}>
              <p className="font-semibold text-sm mb-1" style={{ color: '#1a3a5c' }}>You're confirmed — match coming soon!</p>
              <p className="text-xs" style={{ color: '#5a7a9a', lineHeight: 1.6 }}>
                {appUser?.role === 'Mentor'
                  ? "You're confirmed as a mentor — we're working on finding your match."
                  : "Your match is being arranged. You'll receive an email introduction when paired."}
              </p>
            </div>
          ) : partner ? (
            <div className="flex items-start gap-4 cursor-pointer rounded-xl p-3 -m-3 transition-colors hover:bg-blue-50/40" onClick={() => navigate('/my-match')}>
              <Avatar initials={partner.initials} color={partner.avatar_color} size="lg" />
              <div className="min-w-0">
                <p className="font-bold text-base" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>{partner.name}</p>
                {partner.title && <p className="text-sm" style={{ color: '#2c4a6e' }}>{partner.title}</p>}
                {partner.organization && <p className="text-xs" style={{ color: '#5a7a9a' }}>{partner.organization}</p>}
                {partner.city && <p className="text-xs mt-0.5" style={{ color: '#5a7a9a' }}>{partner.city}</p>}
                {partner.career_stage && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1.5" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{partner.career_stage}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#5a7a9a' }}>Loading match details…</p>
          )}
        </div>

        <div className="rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: '#d4e4f0', background: '#0f2744' }}>
          <div className="px-5 pt-5 pb-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(77,184,200,0.2)' }}>
                <Video size={15} style={{ color: '#4db8c8' }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4db8c8' }}>Monthly Meeting</p>
            </div>
            <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>First Tuesday of every month</p>
            <p className="text-white font-bold text-sm leading-snug mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {formatMeetingDate(nextMeeting)}
            </p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {meetingDays === 0 ? 'Meeting is today!' : meetingDays === 1 ? 'Meeting is tomorrow' : `${meetingDays} days away`}
            </p>
            <div className="mt-auto">
              {teamsLink ? (
                <a
                  href={teamsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: '#2563a8', color: '#fff' }}
                >
                  <Video size={14} /> Join Meeting
                </a>
              ) : (
                <div className="w-full py-2.5 rounded-lg text-xs text-center" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
                  Meeting link coming soon
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: '#1a3a5c' }}>
              <Calendar size={15} style={{ color: '#2563a8' }} /> Upcoming Events
            </h2>
            <button onClick={() => navigate('/events')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563a8' }}>
              View all <ArrowRight size={11} />
            </button>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#5a7a9a' }}>No upcoming events.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map(ev => {
                const typeColor = (EVENT_TYPE_COLORS as Record<string, string>)[ev.event_type] || '#475569';
                const days = daysFromToday(ev.event_date);
                return (
                  <div key={ev.id} className="flex items-start gap-3 rounded-xl p-3 border" style={{ borderColor: '#e8eef5' }}>
                    <div className="rounded-full mt-1.5 shrink-0" style={{ background: typeColor, width: 4, height: 32, minWidth: 4 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-snug" style={{ color: '#1a3a5c' }}>{ev.name}</p>
                        {days !== null && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap" style={days === 0 ? { background: '#dbeafe', color: '#1d4ed8' } : days <= 7 ? { background: '#dcfce7', color: '#166534' } : { background: '#f1f5f9', color: '#5a7a9a' }}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: '#5a7a9a' }}>{formatDate(ev.event_date)}</span>
                        {ev.event_time && <span className="text-xs" style={{ color: '#5a7a9a' }}>{ev.event_time}</span>}
                        {ev.location && <span className="text-xs flex items-center gap-0.5" style={{ color: '#5a7a9a' }}><MapPin size={9} />{ev.location}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {announcement ? (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
            <h2 className="font-semibold text-base flex items-center gap-2 mb-4" style={{ color: '#1a3a5c' }}>
              <Pin size={15} style={{ color: '#2563a8' }} /> Latest Announcement
            </h2>
            <h3 className="font-bold text-sm mb-2" style={{ color: '#1a3a5c' }}>{announcement.title}</h3>
            <p className="text-sm mb-3" style={{ color: '#3d5a78', lineHeight: 1.7 }}>
              {announcement.body.slice(0, 220)}{announcement.body.length > 220 ? '…' : ''}
            </p>
            <button onClick={() => navigate('/announcements')} className="text-xs font-semibold" style={{ color: '#2563a8' }}>
              Read all announcements →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-5 flex items-center justify-center" style={{ borderColor: '#d4e4f0' }}>
            <p className="text-sm text-center" style={{ color: '#7a9ab5' }}>No announcements yet.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
        <h2 className="font-semibold text-sm mb-3" style={{ color: '#1a3a5c' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/my-match')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-blue-50" style={{ color: '#1a3a5c', borderColor: '#c8d8e8', background: 'white' }}>
            <Heart size={14} style={{ color: '#9b1c1c' }} /> My Match
          </button>
          <button onClick={() => navigate('/events')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-blue-50" style={{ color: '#1a3a5c', borderColor: '#c8d8e8', background: 'white' }}>
            <Calendar size={14} style={{ color: '#2563a8' }} /> Events
          </button>
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-blue-50" style={{ color: '#1a3a5c', borderColor: '#c8d8e8', background: 'white' }}>
            <Clock size={14} style={{ color: '#0e7490' }} /> My Profile
          </button>
        </div>
      </div>
    </div>
  );
}
