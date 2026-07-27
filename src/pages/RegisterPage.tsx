import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FIELD_OPTIONS, GOAL_OPTIONS, CAREER_STAGES, COMM_STYLES, CADENCE_OPTIONS, AVAILABILITY_OPTIONS, AVATAR_COLORS } from '../lib/constants';
import { CheckCircle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

const SECTIONS = [
  'Contact Information',
  'Participation Role',
  'Career Stage',
  'Professional Focus',
  'Areas of Guidance',
  'Mentorship Goals',
  'Communication & Matching',
  'Meeting Preferences',
  'Open-Ended Questions',
];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0a1f3c' }}>
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
      style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}
      onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
      onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
    />
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all resize-none"
      style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: '#0a1f3c' }}
      onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
      onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
    />
  );
}

function RadioGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
          <div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
            style={{ borderColor: value === opt ? '#1a6b6e' : '#c8c2ba', background: value === opt ? '#1a6b6e' : 'transparent' }}
            onClick={() => onChange(opt)}
          >
            {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <span className="text-sm cursor-pointer" style={{ color: '#2d2d2d' }} onClick={() => onChange(opt)}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else if (!max || value.length < max) {
      onChange([...value, opt]);
    }
  }
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => {
        const checked = value.includes(opt);
        const disabled = !checked && !!max && value.length >= max;
        return (
          <label key={opt} className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-40' : ''}`}>
            <div
              className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0"
              style={{ borderColor: checked ? '#1a6b6e' : '#c8c2ba', background: checked ? '#1a6b6e' : 'transparent' }}
              onClick={() => !disabled && toggle(opt)}
            >
              {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="text-sm" style={{ color: '#2d2d2d' }} onClick={() => !disabled && toggle(opt)}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function Select({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
      style={{ background: '#faf7f2', border: '1.5px solid #e4dfd5', color: value ? '#0a1f3c' : '#9d948b' }}
      onFocus={e => (e.target.style.borderColor = '#1a6b6e')}
      onBlur={e => (e.target.style.borderColor = '#e4dfd5')}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function RegisterPage() {
  const [section, setSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [titleField, setTitleField] = useState('');
  const [org, setOrg] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [primaryField, setPrimaryField] = useState('');
  const [otherField, setOtherField] = useState('');
  const [areasOffering, setAreasOffering] = useState<string[]>([]);
  const [areasSeeking, setAreasSeeking] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState('');
  const [cadence, setCadence] = useState('');
  const [crossDiscipline, setCrossDiscipline] = useState('');
  const [meetingPref, setMeetingPref] = useState('');
  const [availability, setAvailability] = useState('');
  const [goalsText, setGoalsText] = useState('');
  const [topicsText, setTopicsText] = useState('');
  const [matchNotes, setMatchNotes] = useState('');

  const sections = [
    <>
      <div className="grid grid-cols-2 gap-4">
        <div><Label required>First Name</Label><Input value={firstName} onChange={setFirstName} placeholder="Jane" /></div>
        <div><Label required>Last Name</Label><Input value={lastName} onChange={setLastName} placeholder="Smith" /></div>
      </div>
      <div className="mt-4"><Label required>Email Address</Label><Input type="email" value={email} onChange={setEmail} placeholder="jane@example.com" /></div>
      <div className="mt-4"><Label required>Password</Label><Input type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" /></div>
      <div className="mt-4"><Label>Phone</Label><Input value={phone} onChange={setPhone} placeholder="(559) 555-0100" /></div>
      <div className="mt-4"><Label>Title / Role</Label><Input value={titleField} onChange={setTitleField} placeholder="Project Engineer" /></div>
      <div className="mt-4"><Label>Organization</Label><Input value={org} onChange={setOrg} placeholder="Caltrans District 6" /></div>
      <div className="mt-4"><Label>City</Label><Input value={city} onChange={setCity} placeholder="Fresno" /></div>
    </>,

    <>
      <p className="text-sm mb-4" style={{ color: '#6b6560', lineHeight: 1.7 }}>How would you like to participate in the WTS-CenCal Mentorship Program?</p>
      <div className="flex flex-col gap-3">
        {[
          { value: 'Mentor', label: 'I want to be a Mentor', desc: 'Share your experience and guide an emerging professional.' },
          { value: 'Mentee', label: 'I want to be a Mentee', desc: 'Receive guidance and grow your career with support from an experienced mentor.' },
        ].map(opt => (
          <label
            key={opt.value}
            className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border"
            style={{ background: role === opt.value ? '#e6f4f4' : 'white', borderColor: role === opt.value ? '#1a6b6e' : '#e4dfd5' }}
            onClick={() => setRole(opt.value)}
          >
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all" style={{ borderColor: role === opt.value ? '#1a6b6e' : '#c8c2ba', background: role === opt.value ? '#1a6b6e' : 'transparent' }}>
              {role === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#0a1f3c' }}>{opt.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </>,

    <>
      <p className="text-sm mb-4" style={{ color: '#6b6560' }}>Which best describes your current career stage?</p>
      <RadioGroup options={CAREER_STAGES} value={careerStage} onChange={setCareerStage} />
    </>,

    <>
      <p className="text-sm mb-4" style={{ color: '#6b6560' }}>Which best describes your primary field or area of work?</p>
      <RadioGroup options={FIELD_OPTIONS.filter(o => o !== 'Other')} value={primaryField} onChange={setPrimaryField} />
      <label className="flex items-center gap-3 mt-2 cursor-pointer" onClick={() => setPrimaryField('Other')}>
        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: primaryField === 'Other' ? '#1a6b6e' : '#c8c2ba', background: primaryField === 'Other' ? '#1a6b6e' : 'transparent' }}>
          {primaryField === 'Other' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <span className="text-sm" style={{ color: '#2d2d2d' }}>Other</span>
      </label>
      {primaryField === 'Other' && (
        <div className="mt-2 ml-7"><Input value={otherField} onChange={setOtherField} placeholder="Describe your field" /></div>
      )}
    </>,

    <>
      {role === 'Mentor' ? (
        <>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0a1f3c' }}>What areas can you offer guidance in? (Select all that apply)</p>
          <CheckboxGroup options={FIELD_OPTIONS} value={areasOffering} onChange={setAreasOffering} />
        </>
      ) : (
        <>
          <p className="text-sm font-semibold mb-3" style={{ color: '#0a1f3c' }}>What areas would you most like guidance in? (Select all that apply)</p>
          <CheckboxGroup options={FIELD_OPTIONS} value={areasSeeking} onChange={setAreasSeeking} />
        </>
      )}
    </>,

    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: '#0a1f3c' }}>What would make this program valuable for you? Select up to 3.</p>
        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: goals.length === 3 ? '#e6f4f4' : '#f0ebe2', color: goals.length === 3 ? '#1a6b6e' : '#6b6560' }}>
          {goals.length} of 3 selected
        </span>
      </div>
      <CheckboxGroup options={GOAL_OPTIONS} value={goals} onChange={setGoals} max={3} />
    </>,

    <>
      <div className="mb-5">
        <Label>Communication Style</Label>
        <p className="text-xs mb-3" style={{ color: '#6b6560' }}>How would you describe your preferred communication style?</p>
        <Select options={COMM_STYLES} value={commStyle} onChange={setCommStyle} placeholder="Select a style…" />
      </div>
      <div className="mb-5">
        <Label>Between-Meeting Cadence</Label>
        <p className="text-xs mb-3" style={{ color: '#6b6560' }}>How often would you like to connect between formal meetings?</p>
        <RadioGroup options={CADENCE_OPTIONS} value={cadence} onChange={setCadence} />
      </div>
      <div>
        <Label>Open to cross-discipline match?</Label>
        <RadioGroup options={['Yes', 'No', 'Maybe']} value={crossDiscipline} onChange={setCrossDiscipline} />
      </div>
    </>,

    <>
      <div className="mb-5">
        <Label>Preferred Meeting Format</Label>
        <RadioGroup options={['Virtual', 'In-Person', 'Either']} value={meetingPref} onChange={setMeetingPref} />
      </div>
      <div>
        <Label>Availability</Label>
        <RadioGroup options={AVAILABILITY_OPTIONS} value={availability} onChange={setAvailability} />
      </div>
    </>,

    <>
      <p className="text-xs mb-5" style={{ color: '#6b6560' }}>All questions in this section are optional, but your answers help us make stronger matches.</p>
      <div className="mb-4">
        <Label>What are you hoping to get from this program?</Label>
        <Textarea value={goalsText} onChange={setGoalsText} placeholder="Share your goals for this mentorship experience…" />
      </div>
      <div className="mb-4">
        <Label>What specific topics, questions, or challenges would you like to discuss?</Label>
        <Textarea value={topicsText} onChange={setTopicsText} placeholder="Technical skills, career navigation, leadership, etc." />
      </div>
      <div>
        <Label>Is there anything else that would help us make a strong match for you?</Label>
        <Textarea value={matchNotes} onChange={setMatchNotes} placeholder="Industry preferences, personality fit, schedule constraints…" />
      </div>
    </>,
  ];

  function canAdvance() {
    if (section === 0) return firstName.trim() && lastName.trim() && email.trim() && password.trim().length >= 8;
    if (section === 1) return !!role;
    if (section === 2) return !!careerStage;
    if (section === 3) return !!primaryField;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        setError('An application with this email address already exists.');
        setLoading(false);
        return;
      }

      const { data: allParticipants } = await supabase.from('participants').select('id');
      const count = allParticipants?.length || 0;
      const colorIndex = count % AVATAR_COLORS.length;
      const color = AVATAR_COLORS[colorIndex];
      const initials = (firstName[0] + lastName[0]).toUpperCase();
      const resolvedField = primaryField === 'Other' && otherField ? otherField : primaryField;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('participants').insert({
        email: email.trim().toLowerCase(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim() || '',
        title: titleField.trim() || '',
        organization: org.trim() || '',
        city: city.trim() || '',
        role: role as 'Mentor' | 'Mentee',
        status: 'Pending',
        career_stage: careerStage || '',
        primary_field: resolvedField || '',
        guidance_areas: role === 'Mentor' ? areasOffering : areasSeeking,
        goals,
        communication_style: commStyle || '',
        meeting_format: meetingPref || '',
        availability: availability || '',
        cadence: cadence || '',
        cross_discipline: crossDiscipline === 'Yes',
        goals_text: goalsText.trim() || '',
        topics_text: topicsText.trim() || '',
        match_notes: matchNotes.trim() || '',
        avatar_color: color,
        initials,
        auth_user_id: authData.user?.id || null,
      });

      if (insertError) {
        setError('Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#faf7f2' }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-sm border" style={{ borderColor: '#e4dfd5' }}>
          <CheckCircle size={56} style={{ color: '#1a6b6e' }} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Application Received!</h2>
          <p style={{ color: '#6b6560', lineHeight: 1.7, fontSize: 15 }}>
            Thank you for applying to the WTS-CenCal Mentorship Program. The Mentorship Committee will review your application and notify you by email once approved.
          </p>
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#e4dfd5' }}>
            <Link to="/login" className="text-sm font-semibold" style={{ color: '#1a6b6e' }}>Return to login</Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = (section / (SECTIONS.length - 1)) * 100;

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#faf7f2' }}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>WTS-CenCal Mentorship Portal</p>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>Program Application</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e4dfd5' }}>
          <div className="h-1.5" style={{ background: '#e4dfd5' }}>
            <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: '#1a6b6e' }} />
          </div>

          <div className="px-8 py-6 border-b" style={{ borderColor: '#f0ebe2' }}>
            <p className="text-xs font-medium mb-0.5" style={{ color: '#1a6b6e' }}>Step {section + 1} of {SECTIONS.length}</p>
            <h2 className="text-xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{SECTIONS[section]}</h2>
          </div>

          <div className="px-8 py-6 min-h-[280px]">
            {sections[section]}
            {error && (
              <div className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                {error}
              </div>
            )}
          </div>

          <div className="px-8 py-5 border-t flex items-center justify-between" style={{ borderColor: '#f0ebe2', background: '#faf7f2' }}>
            <button
              onClick={() => setSection(s => s - 1)}
              disabled={section === 0}
              className="flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-30"
              style={{ color: '#6b6560' }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            {section < SECTIONS.length - 1 ? (
              <button
                onClick={() => setSection(s => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: '#0a1f3c', opacity: canAdvance() ? 1 : 0.4 }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: '#c8922a', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-xs" style={{ color: '#6b6560' }}>Already have an account? <span style={{ color: '#1a6b6e', fontWeight: 600 }}>Sign in</span></Link>
        </div>
      </div>
    </div>
  );
}
