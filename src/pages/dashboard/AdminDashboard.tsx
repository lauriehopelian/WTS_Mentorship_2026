import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Link2, Clock, UserCheck, ArrowRight, Megaphone, Calendar, MapPin, Video, TrendingUp } from 'lucide-react';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import { PageLoader } from '../../components/LoadingSpinner';
import { getNextFirstTuesday, formatMeetingDate, daysUntil } from '../../lib/meetingUtils';
import { EVENT_TYPE_COLORS } from '../../lib/constants';
import type { Event } from '../../lib/supabase';

function StatCard({ label, value, icon: Icon, color, onClick, sub }: {
  label: string; value: number | string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string; onClick?: () => void; sub?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-5 border flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      style={{ borderColor: '#d4e4f0' }}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>{value}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: '#5a7a9a' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#2563a8' }}>{sub}</p>}
      </div>
    </div>
  );
}

function formatEventDate(d?: string) {
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ mentors: 0, mentees: 0, matches: 0, pending: 0 });
  const [recentCheckins, setRecentCheckins] = useState<Record<string, unknown>[]>([]);
  const [recentParticipants, setRecentParticipants] = useState<Record<string, unknown>[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [teamsLink, setTeamsLink] = useState('');

  const nextMeeting = getNextFirstTuesday();
  const meetingDays = daysUntil(nextMeeting);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const [participantsRes, matchesRes, checkinsRes, eventsRes, configRes] = await Promise.all([
        supabase.from('participants').select('id, name, role, status, organization, city, avatar_color, initials, created_at').order('created_at', { ascending: false }),
        supabase.from('matches').select('id, status'),
        supabase.from('checkins').select('id, match_name, checkin_date, completed_by, rating').order('checkin_date', { ascending: false }).limit(5),
        supabase.from('events').select('*').gte('event_date', today).order('event_date', { ascending: true }).limit(5),
        supabase.from('app_config').select('key, value').eq('key', 'wts_teams_link').maybeSingle(),
      ]);

      const participants = participantsRes.data || [];
      const matches = matchesRes.data || [];

      setStats({
        mentors: participants.filter(p => p.role === 'Mentor' && p.status === 'Active').length,
        mentees: participants.filter(p => p.role === 'Mentee' && p.status === 'Active').length,
        matches: matches.filter(m => m.status === 'Active').length,
        pending: participants.filter(p => p.status === 'Pending').length,
      });

      setRecentCheckins((checkinsRes.data || []) as Record<string, unknown>[]);
      setRecentParticipants(participants.slice(0, 5) as Record<string, unknown>[]);
      setUpcomingEvents(eventsRes.data || []);
      setTeamsLink(configRes.data?.value || '');
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Program Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#5a7a9a' }}>WTS-CenCal Mentorship Program · 2024–25</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Active Mentors" value={stats.mentors} icon={Users} color="#2563a8" />
        <StatCard label="Active Mentees" value={stats.mentees} icon={Users} color="#0e7490" />
        <StatCard label="Active Matches" value={stats.matches} icon={Link2} color="#166534" />
        <StatCard
          label="Pending Applications"
          value={stats.pending}
          icon={Clock}
          color="#9b1c1c"
          onClick={stats.pending > 0 ? () => navigate('/participants?filter=Pending') : undefined}
          sub={stats.pending > 0 ? 'Click to review' : undefined}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-7">
        <button onClick={() => navigate('/participants?filter=Pending')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-blue-50" style={{ color: '#1a3a5c', borderColor: '#c8d8e8', background: 'white' }}>
          <UserCheck size={16} /> Review Pending ({stats.pending})
        </button>
        <button onClick={() => navigate('/matches')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style={{ background: '#2563a8' }}>
          <Link2 size={16} /> Create Match
        </button>
        <button onClick={() => navigate('/announcements')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style={{ background: '#0f2744' }}>
          <Megaphone size={16} /> New Announcement
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: '#1a3a5c' }}>
              <Calendar size={15} style={{ color: '#2563a8' }} /> Upcoming Events
            </h2>
            <button onClick={() => navigate('/events')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563a8' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#5a7a9a' }}>No upcoming events.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingEvents.map(ev => {
                const typeColor = (EVENT_TYPE_COLORS as Record<string, string>)[ev.event_type] || '#475569';
                const days = daysFromToday(ev.event_date);
                return (
                  <div key={ev.id} className="flex items-start gap-3 rounded-xl p-3 border transition-colors hover:bg-blue-50/30" style={{ borderColor: '#e8eef5' }}>
                    <div className="rounded-full mt-2 shrink-0" style={{ background: typeColor, width: 4, height: 36, minWidth: 4 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-snug" style={{ color: '#1a3a5c' }}>{ev.name}</p>
                        {days !== null && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap" style={days === 0 ? { background: '#dbeafe', color: '#1d4ed8' } : days <= 7 ? { background: '#dcfce7', color: '#166534' } : { background: '#f1f5f9', color: '#5a7a9a' }}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days}d`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: '#5a7a9a' }}>{formatEventDate(ev.event_date)}</span>
                        {ev.event_time && <span className="text-xs" style={{ color: '#5a7a9a' }}>{ev.event_time}</span>}
                        {ev.location && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#5a7a9a' }}>
                            <MapPin size={10} />{ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#d4e4f0', background: '#0f2744' }}>
            <div className="px-5 pt-5 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(77,184,200,0.2)' }}>
                  <Video size={15} style={{ color: '#4db8c8' }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4db8c8' }}>Monthly Meeting</p>
              </div>
              <p className="text-white font-bold text-sm leading-snug mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {formatMeetingDate(nextMeeting)}
              </p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {meetingDays === 0 ? 'Meeting is today!' : meetingDays === 1 ? 'Meeting is tomorrow' : `${meetingDays} days away`}
              </p>
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
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.45)' }}
                >
                  Add meeting link in Settings
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 flex-1" style={{ borderColor: '#d4e4f0' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} style={{ color: '#2563a8' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#1a3a5c' }}>Quick Stats</h2>
            </div>
            <div className="flex flex-col gap-0">
              {[
                { label: 'Match rate', value: stats.mentors > 0 ? `${Math.round((stats.matches / Math.min(stats.mentors, stats.mentees || 1)) * 100)}%` : '—' },
                { label: 'Pending review', value: stats.pending },
                { label: 'Total active', value: stats.mentors + stats.mentees },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#e8eef5' }}>
                  <span className="text-xs" style={{ color: '#5a7a9a' }}>{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: '#1a3a5c' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1a3a5c' }}>Recent Check-Ins</h2>
            <button onClick={() => navigate('/checkins')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563a8' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentCheckins.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#5a7a9a' }}>No check-ins logged yet.</p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: '#e8eef5' }}>
              {recentCheckins.map((ci) => {
                const c = ci as { id: string; match_name: string; checkin_date: string; completed_by: string; rating: number };
                return (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1a3a5c' }}>{c.match_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5a7a9a' }}>{c.checkin_date} · {c.completed_by}</p>
                    </div>
                    {c.rating > 0 && <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{'★'.repeat(c.rating)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#d4e4f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1a3a5c' }}>New Participants</h2>
            <button onClick={() => navigate('/participants')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563a8' }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentParticipants.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#5a7a9a' }}>No participants yet.</p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: '#e8eef5' }}>
              {recentParticipants.map((p) => {
                const participant = p as { id: string; name: string; role: string; status: string; organization: string; city: string; avatar_color: string; initials: string };
                return (
                  <div key={participant.id} className="py-3 flex items-center gap-3">
                    <Avatar initials={participant.initials} color={participant.avatar_color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#1a3a5c' }}>{participant.name}</p>
                      <p className="text-xs truncate" style={{ color: '#5a7a9a' }}>{participant.role} · {participant.organization || participant.city}</p>
                    </div>
                    <StatusBadge status={participant.status} small />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
