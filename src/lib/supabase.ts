import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Participant = {
  id: string;
  email: string;
  name: string;
  phone: string;
  title: string;
  organization: string;
  city: string;
  role: 'Mentor' | 'Mentee';
  status: 'Pending' | 'Active' | 'Alumni';
  is_admin: boolean;
  career_stage: string;
  primary_field: string;
  guidance_areas: string[];
  goals: string[];
  communication_style: string;
  meeting_format: string;
  availability: string;
  cadence: string;
  cross_discipline: boolean;
  goals_text: string;
  topics_text: string;
  match_notes: string;
  avatar_color: string;
  initials: string;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  status: 'Active' | 'Completed' | 'Paused';
  matched_date: string;
  notes: string;
  shared_goals: string[];
  created_at: string;
  updated_at: string;
};

export type CheckIn = {
  id: string;
  match_id: string;
  match_name: string;
  checkin_date: string;
  notes: string;
  completed_by: string;
  rating: number;
  created_at: string;
};

export type Event = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  location: string;
  description: string;
  event_type: string;
  audience: 'Everyone' | 'Mentors' | 'Mentees' | 'Admin Only';
  rsvp_count: number;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  posted_by: string;
  audience: 'Everyone' | 'Mentors' | 'Mentees';
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type Rsvp = {
  id: string;
  event_id: string;
  participant_id: string;
  participant_email: string;
  rsvp_date: string;
  rsvp_status: 'Going' | 'Maybe' | 'Not Going';
  created_at: string;
  updated_at: string;
};
