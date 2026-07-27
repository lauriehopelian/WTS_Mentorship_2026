import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppUser } from '../../App';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import { PageLoader } from '../../components/LoadingSpinner';
import { Pin, Plus, Trash2, Loader2, CreditCard as Edit2 } from 'lucide-react';
import type { Announcement } from '../../lib/supabase';

function formatDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const appUser = useAppUser();
  const isAdmin = appUser?.is_admin || false;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('Everyone');
  const [pinned, setPinned] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() { setTitle(''); setBody(''); setAudience('Everyone'); setPinned(false); }

  async function handleSave() {
    if (!title.trim()) { showToast('Title is required.', 'warning'); return; }
    setSaving(true);
    try {
      const fields = { title, body, audience, pinned, posted_by: appUser?.name || 'Admin' };
      if (editItem) {
        const { error } = await supabase.from('announcements').update(fields).eq('id', editItem.id);
        if (error) throw error;
        showToast('Announcement updated.', 'success');
        setEditItem(null);
      } else {
        const { error } = await supabase.from('announcements').insert(fields);
        if (error) throw error;
        showToast('Announcement published.', 'success');
        setShowCreate(false);
      }
      resetForm();
      await load();
    } catch {
      showToast('Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(a: Announcement) {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', a.id);
    if (error) {
      showToast('Delete failed.', 'error');
    } else {
      showToast('Deleted.', 'success');
      await load();
    }
  }

  const visible = announcements.filter(a => {
    if (isAdmin) return true;
    if (a.audience === 'Everyone') return true;
    if (a.audience === 'Mentors' && appUser?.role === 'Mentor') return true;
    if (a.audience === 'Mentees' && appUser?.role === 'Mentee') return true;
    return false;
  });

  const FormContent = () => (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} placeholder="Announcement title" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Body</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }} placeholder="Announcement content…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Audience</label>
          <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1.5px solid #e4dfd5', background: '#faf7f2' }}>
            {['Everyone', 'Mentors', 'Mentees'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>Pin to top?</label>
          <button onClick={() => setPinned(p => !p)} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all" style={pinned ? { background: '#fef3e2', borderColor: '#c8922a', color: '#c8922a' } : { borderColor: '#e4dfd5', color: '#6b6560' }}>
            <Pin size={14} /> {pinned ? 'Pinned' : 'Not pinned'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Announcements</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>{visible.length} total</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowCreate(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#c8922a' }}>
            <Plus size={16} /> New Announcement
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: '#e4dfd5' }}>
          <p className="text-sm" style={{ color: '#6b6560' }}>No announcements yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map(a => (
            <div key={a.id} className="bg-white rounded-xl border p-5" style={{ borderColor: a.pinned ? '#c8922a' : '#e4dfd5', boxShadow: a.pinned ? '0 0 0 1.5px rgba(200,146,42,0.2)' : 'none' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5">
                  {a.pinned && <Pin size={15} style={{ color: '#c8922a', flexShrink: 0, marginTop: 3 }} />}
                  <h2 className="font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{a.title}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: '#1a6b6e', color: '#1a6b6e', background: '#e6f4f4' }}>{a.audience}</span>
                  {isAdmin && (
                    <>
                      <button onClick={() => { setEditItem(a); setTitle(a.title); setBody(a.body); setAudience(a.audience); setPinned(a.pinned); }} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#6b6560' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: '#8c3a3a' }}><Trash2 size={13} /></button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: '#444', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{a.body}</p>
              <p className="text-xs" style={{ color: '#9d948b' }}>{a.posted_by} · {formatDate(a.created_at?.split('T')[0])}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="New Announcement" size="md"
        footer={<><button onClick={() => { setShowCreate(false); resetForm(); }} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#6b6560', borderColor: '#e4dfd5' }}>Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#c8922a', opacity: saving ? 0.7 : 1 }}>{saving && <Loader2 size={14} className="animate-spin" />}Publish</button></>}>
        <FormContent />
      </Modal>

      <Modal open={!!editItem} onClose={() => { setEditItem(null); resetForm(); }} title="Edit Announcement" size="md"
        footer={<><button onClick={() => { setEditItem(null); resetForm(); }} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ color: '#6b6560', borderColor: '#e4dfd5' }}>Cancel</button><button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2" style={{ background: '#c8922a', opacity: saving ? 0.7 : 1 }}>{saving && <Loader2 size={14} className="animate-spin" />}Save Changes</button></>}>
        <FormContent />
      </Modal>
    </div>
  );
}
