/*
  # WTS-CenCal Mentorship Portal - Full Schema

  ## Tables Created
  1. `participants` - User profiles for mentors and mentees
  2. `matches` - Mentor-mentee pairings
  3. `checkins` - Meeting check-in logs
  4. `events` - Program events
  5. `announcements` - Broadcast messages
  6. `rsvps` - Event attendance responses
  7. `app_config` - Application configuration (email settings)

  ## Security
  - RLS enabled on all tables
  - Participants can read/update their own records
  - Admins (identified by is_admin flag) have full access
  - Public read for events and announcements
*/

-- PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  title text DEFAULT '',
  organization text DEFAULT '',
  city text DEFAULT '',
  role text DEFAULT 'Mentee' CHECK (role IN ('Mentor', 'Mentee')),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Alumni')),
  is_admin boolean DEFAULT false,
  career_stage text DEFAULT '',
  primary_field text DEFAULT '',
  guidance_areas text[] DEFAULT '{}',
  goals text[] DEFAULT '{}',
  communication_style text DEFAULT '',
  meeting_format text DEFAULT '',
  availability text DEFAULT '',
  cadence text DEFAULT '',
  cross_discipline boolean DEFAULT false,
  goals_text text DEFAULT '',
  topics_text text DEFAULT '',
  match_notes text DEFAULT '',
  avatar_color text DEFAULT '#1a6b6e',
  initials text DEFAULT '',
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read all participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participants can update own record"
  ON participants FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can insert participants"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
    OR auth_user_id = auth.uid()
  );

CREATE POLICY "Admins can update any participant"
  ON participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete participants"
  ON participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- Allow insert during registration (before auth user exists in participants yet)
CREATE POLICY "Allow self registration insert"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  mentee_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  mentor_name text DEFAULT '',
  mentee_name text DEFAULT '',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused')),
  matched_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  shared_goals text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete matches"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Participants can update match notes"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    mentor_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
    OR mentee_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    mentor_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
    OR mentee_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
  );

-- CHECKINS TABLE
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  match_name text DEFAULT '',
  checkin_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  completed_by text DEFAULT '',
  rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read checkins"
  ON checkins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert checkins"
  ON checkins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update checkins"
  ON checkins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete checkins"
  ON checkins FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  event_date date,
  event_time text DEFAULT '',
  location text DEFAULT '',
  description text DEFAULT '',
  event_type text DEFAULT 'Workshop',
  audience text DEFAULT 'Everyone' CHECK (audience IN ('Everyone', 'Mentors', 'Mentees', 'Admin Only')),
  rsvp_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  body text DEFAULT '',
  posted_by text DEFAULT '',
  audience text DEFAULT 'Everyone' CHECK (audience IN ('Everyone', 'Mentors', 'Mentees')),
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- RSVPS TABLE
CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  participant_email text DEFAULT '',
  rsvp_date date DEFAULT CURRENT_DATE,
  rsvp_status text DEFAULT 'Going' CHECK (rsvp_status IN ('Going', 'Maybe', 'Not Going')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, participant_id)
);

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rsvps"
  ON rsvps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participants can insert own rsvp"
  ON rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    participant_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Participants can update own rsvp"
  ON rsvps FOR UPDATE
  TO authenticated
  USING (
    participant_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    participant_id IN (SELECT id FROM participants WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete rsvps"
  ON rsvps FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- APP CONFIG TABLE
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read app config"
  ON app_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert app config"
  ON app_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update app config"
  ON app_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_role ON participants(role);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_auth_user_id ON participants(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_mentor_id ON matches(mentor_id);
CREATE INDEX IF NOT EXISTS idx_matches_mentee_id ON matches(mentee_id);
CREATE INDEX IF NOT EXISTS idx_checkins_match_id ON checkins(match_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_participant_id ON rsvps(participant_id);
