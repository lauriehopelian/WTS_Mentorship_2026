import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function InviteParticipantPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Mentor' | 'Mentee'>('Mentee');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setSuccess(null);
    setError(null);

    const redirectTo = new URL(`${import.meta.env.BASE_URL}activate`, window.location.origin).toString();
    const { data, error: invokeError } = await supabase.functions.invoke('invite-participant', {
      body: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        title: title.trim(),
        organization: organization.trim(),
        phone: phone.trim(),
        city: city.trim(),
        redirectTo,
      },
    });

    setSending(false);

    if (invokeError || data?.error) {
      setError(data?.error || invokeError?.message || 'Invitation could not be sent.');
      return;
    }

    setSuccess(`Invitation sent to ${email.trim().toLowerCase()}. They will appear under Awaiting Activation until they finish setup.`);
    setName('');
    setEmail('');
    setRole('Mentee');
    setTitle('');
    setOrganization('');
    setPhone('');
    setCity('');
  }

  const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm outline-none';
  const inputStyle = { background: '#fff', border: '1.5px solid #d9e1e8', color: '#0a1f3c' };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Invite Participant</h1>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: '#6b6560' }}>
          Use this only after an application has been approved in Airtable. The participant will receive a secure portal invitation and remain in Awaiting Activation until they finish setup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6" style={{ borderColor: '#e4dfd5' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>
            Full name <span style={{ color: '#b91c1c' }}>*</span>
            <input required value={name} onChange={e => setName(e.target.value)} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>

          <label className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>
            Email <span style={{ color: '#b91c1c' }}>*</span>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>

          <label className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>
            Program role
            <select value={role} onChange={e => setRole(e.target.value as 'Mentor' | 'Mentee')} className={`${inputClass} mt-1.5`} style={inputStyle}>
              <option value="Mentee">Mentee</option>
              <option value="Mentor">Mentor</option>
            </select>
          </label>

          <label className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>
            Job title
            <input value={title} onChange={e => setTitle(e.target.value)} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>

          <label className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>
            Organization
            <input value={organization} onChange={e => setOrganization(e.target.value)} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>

          <label className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>
            Phone
            <input value={phone} onChange={e => setPhone(e.target.value)} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>

          <label className="text-sm font-semibold md:col-span-2" style={{ color: '#0a1f3c' }}>
            City
            <input value={city} onChange={e => setCity(e.target.value)} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
        </div>

        {success && (
          <div className="rounded-lg px-4 py-3 text-sm mt-5" style={{ background: '#ecf8f2', color: '#17653b', border: '1px solid #b8e2c9' }}>
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm mt-5" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs" style={{ color: '#8b8179' }}>Application approval remains in Airtable. This action grants portal access only.</p>
          <button
            type="submit"
            disabled={sending}
            className="shrink-0 rounded-lg px-5 py-2.5 font-semibold text-white text-sm transition-opacity"
            style={{ background: '#1a6b6e', opacity: sending ? 0.65 : 1 }}
          >
            {sending ? 'Sending…' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}
