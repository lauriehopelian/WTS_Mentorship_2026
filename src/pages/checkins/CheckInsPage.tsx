import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PageLoader } from '../../components/LoadingSpinner';
import { Search } from 'lucide-react';
import type { CheckIn } from '../../lib/supabase';

export default function CheckInsPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .order('checkin_date', { ascending: false });
      setCheckins(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = checkins.filter(c => {
    const q = search.toLowerCase();
    return !q || c.match_name.toLowerCase().includes(q) || c.completed_by.toLowerCase().includes(q);
  });

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Check-Ins</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>{checkins.length} total logged</p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9d948b' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by match or person…"
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'white', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}
          onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
          onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e4dfd5' }}>
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: '#6b6560' }}>No check-ins found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left" style={{ background: '#faf7f2', borderBottom: '1px solid #e4dfd5' }}>
                {['Match', 'Date', 'Logged By', 'Rating', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b6560' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ebe2' : 'none' }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: '#0a1f3c' }}>{c.match_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#444' }}>{c.checkin_date || '—'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#444' }}>{c.completed_by || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.rating > 0 ? <span style={{ color: '#c8922a' }}>{'★'.repeat(c.rating)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs" style={{ color: '#6b6560' }}>
                    <span className="line-clamp-1">{c.notes || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
