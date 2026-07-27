import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Event } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import { PageLoader } from '../../components/LoadingSpinner';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { EVENT_TYPE_COLORS } from '../../lib/constants';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatEventDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface MonthGridProps {
  year: number;
  month: number;
  events: Event[];
  today: { y: number; m: number; d: number };
  onDayClick: (events: Event[], dateLabel: string) => void;
}

function MonthGrid({ year, month, events, today, onDayClick }: MonthGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function eventsOnDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.event_date === dateStr);
  }

  const isToday = (day: number) => today.y === year && today.m === month && today.d === day;

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  while (rows.length < 6) rows.push(Array(7).fill(null));

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-2">
        <span className="text-sm font-semibold" style={{ color: '#1a3a5c', letterSpacing: '0.03em' }}>
          {MONTH_NAMES[month]} {year}
        </span>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium pb-1" style={{ color: '#7a9ab5' }}>{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-rows-6 gap-px">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-px">
            {row.map((day, ci) => {
              if (!day) return <div key={ci} />;
              const dayEvents = eventsOnDay(day);
              const todayMark = isToday(day);
              return (
                <div
                  key={ci}
                  onClick={() => dayEvents.length > 0 && onDayClick(dayEvents, `${MONTH_NAMES[month]} ${day}, ${year}`)}
                  className="relative flex flex-col items-center rounded-md transition-all"
                  style={{
                    cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                    padding: '2px 0',
                    minHeight: 28,
                  }}
                >
                  <span
                    className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                    style={
                      todayMark
                        ? { background: '#2563a8', color: '#fff', fontWeight: 700 }
                        : { color: '#1a3a5c' }
                    }
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center mt-0.5 px-0.5">
                      {dayEvents.slice(0, 3).map((ev, i) => {
                        const color = (EVENT_TYPE_COLORS as Record<string, string>)[ev.event_type] || '#4a5568';
                        return (
                          <span
                            key={i}
                            className="rounded-full"
                            style={{ width: 5, height: 5, background: color, display: 'block' }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const appUser = useAppUser();
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<Event[] | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');

  const now = new Date();
  const [startMonth, setStartMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const visibleEvents = events.filter(ev => {
    if (appUser?.is_admin) return true;
    if (ev.audience === 'Admin Only') return false;
    if (ev.audience === 'Mentors' && appUser?.role !== 'Mentor') return false;
    if (ev.audience === 'Mentees' && appUser?.role !== 'Mentee') return false;
    return true;
  });

  function getMonthOffset(offset: number) {
    let m = startMonth.month + offset;
    let y = startMonth.year;
    while (m >= 12) { m -= 12; y++; }
    while (m < 0) { m += 12; y--; }
    return { year: y, month: m };
  }

  function prevPeriod() {
    const { year, month } = getMonthOffset(-6);
    setStartMonth({ year, month });
  }

  function nextPeriod() {
    const { year, month } = getMonthOffset(6);
    setStartMonth({ year, month });
  }

  const months = [0, 1, 2, 3, 4, 5].map(i => getMonthOffset(i));

  const firstMonth = months[0];
  const lastMonth = months[5];
  const periodLabel = `${MONTH_NAMES[firstMonth.month]} ${firstMonth.year} – ${MONTH_NAMES[lastMonth.month]} ${lastMonth.year}`;

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>Calendar</h1>
          <p className="text-sm mt-0.5" style={{ color: '#5a7a9a' }}>{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="p-2 rounded-lg border transition-colors hover:bg-slate-50"
            style={{ borderColor: '#c8d8e8', color: '#2563a8' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setStartMonth({ year: now.getFullYear(), month: now.getMonth() })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-slate-50"
            style={{ borderColor: '#c8d8e8', color: '#2563a8' }}
          >
            Today
          </button>
          <button
            onClick={nextPeriod}
            className="p-2 rounded-lg border transition-colors hover:bg-slate-50"
            style={{ borderColor: '#c8d8e8', color: '#2563a8' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-rows-2 gap-4" style={{ minHeight: 0 }}>
        {[0, 1].map(row => (
          <div key={row} className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(col => {
              const { year, month } = months[row * 3 + col];
              return (
                <div
                  key={col}
                  className="rounded-2xl border p-4 flex flex-col"
                  style={{
                    background: '#fff',
                    borderColor: '#d4e4f0',
                    boxShadow: '0 1px 4px rgba(26,58,92,0.06)',
                  }}
                >
                  <MonthGrid
                    year={year}
                    month={month}
                    events={visibleEvents}
                    today={today}
                    onDayClick={(evs, label) => { setSelectedEvents(evs); setSelectedLabel(label); }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="rounded-full" style={{ width: 8, height: 8, background: color as string, display: 'inline-block' }} />
            <span className="text-xs" style={{ color: '#5a7a9a' }}>{type}</span>
          </div>
        ))}
      </div>

      {selectedEvents && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(10,25,50,0.45)' }}
          onClick={() => setSelectedEvents(null)}
        >
          <div
            className="rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            style={{ background: '#fff', border: '1px solid #d4e4f0' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} style={{ color: '#2563a8' }} />
                <h3 className="font-bold text-base" style={{ color: '#1a3a5c', fontFamily: "'Playfair Display', serif" }}>{selectedLabel}</h3>
              </div>
              <button
                onClick={() => setSelectedEvents(null)}
                className="text-lg leading-none font-light p-1 rounded hover:bg-slate-100"
                style={{ color: '#7a9ab5' }}
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {selectedEvents.map(ev => {
                const typeColor = (EVENT_TYPE_COLORS as Record<string, string>)[ev.event_type] || '#4a5568';
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl overflow-hidden border"
                    style={{ borderColor: '#d4e4f0' }}
                  >
                    <div className="px-3 py-1.5" style={{ background: typeColor }}>
                      <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">{ev.event_type}</span>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm mb-1.5" style={{ color: '#1a3a5c' }}>{ev.name}</p>
                      <div className="flex flex-col gap-1">
                        {ev.event_time && (
                          <p className="text-xs flex items-center gap-1.5" style={{ color: '#5a7a9a' }}>
                            <Clock size={11} style={{ color: typeColor }} />{ev.event_time}
                          </p>
                        )}
                        {ev.location && (
                          <p className="text-xs flex items-center gap-1.5" style={{ color: '#5a7a9a' }}>
                            <MapPin size={11} style={{ color: typeColor }} />{ev.location}
                          </p>
                        )}
                        {ev.description && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7a9ab5', lineHeight: 1.5 }}>{ev.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
