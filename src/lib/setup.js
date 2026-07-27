const META_URL = 'https://api.airtable.com/v0/meta/bases';
const FIELD_LIST = ['Civil Engineering', 'Transportation Planning', 'Construction Management', 'Environmental', 'Public Agency / Government', 'Business Development', 'Materials Testing / Inspection', 'Project Finance / Funding', 'DBE / Certification Navigation', 'Leadership / Career Growth', 'Other'];

function opts(choices) {
  return { choices: choices.map(name => ({ name })) };
}

const TABLES = [
  {
    name: 'PARTICIPANTS',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Email', type: 'singleLineText' },
      { name: 'Phone', type: 'singleLineText' },
      { name: 'Title', type: 'singleLineText' },
      { name: 'Organization', type: 'singleLineText' },
      { name: 'City', type: 'singleLineText' },
      { name: 'Role', type: 'singleSelect', options: opts(['Mentor', 'Mentee']) },
      { name: 'Status', type: 'singleSelect', options: opts(['Pending', 'Active', 'Alumni']) },
      { name: 'Career Stage', type: 'singleSelect', options: opts(['Student', 'Early Career', 'Mid-Career', 'Senior-Level / Executive', 'Career Transition']) },
      { name: 'Primary Field', type: 'singleSelect', options: opts(FIELD_LIST) },
      { name: 'Areas Offering Guidance', type: 'multipleSelects', options: opts(FIELD_LIST) },
      { name: 'Areas Seeking Guidance', type: 'multipleSelects', options: opts(FIELD_LIST) },
      { name: 'Mentorship Goals', type: 'multipleSelects', options: opts(['Career Advice', 'Technical Guidance', 'Leadership Development', 'Networking / Industry Connections', 'Confidence / Professional Presence', 'Navigating Workplace Challenges', 'Career Transition Support', 'Accountability / Goal Tracking', 'Certifications / Advancement', 'Exposure to New Career Paths']) },
      { name: 'Communication Style', type: 'singleSelect', options: opts(['Direct and Candid', 'Encouraging and Supportive', 'Strategic / Big-Picture', 'Practical / Tactical', 'Structured and Goal-Oriented', 'Flexible and Conversational']) },
      { name: 'Meeting Preference', type: 'singleSelect', options: opts(['Virtual', 'In-Person', 'Either']) },
      { name: 'Availability', type: 'singleSelect', options: opts(['Flexible', 'Weekday Mornings', 'Weekday Lunch Hour', 'Weekday Evenings', 'Other']) },
      { name: 'Between-Meeting Cadence', type: 'singleSelect', options: opts(['Weekly check-ins welcome', 'Monthly only', 'As-needed / don\'t over-schedule', 'No preference']) },
      { name: 'Open to Cross-Discipline Match', type: 'singleSelect', options: opts(['Yes', 'No', 'Maybe']) },
      { name: 'Goals Text', type: 'multilineText' },
      { name: 'Topics Text', type: 'multilineText' },
      { name: 'Match Notes', type: 'multilineText' },
      { name: 'Color', type: 'singleLineText' },
      { name: 'Initials', type: 'singleLineText' },
    ],
  },
  {
    name: 'MATCHES',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Mentor Record ID', type: 'singleLineText' },
      { name: 'Mentee Record ID', type: 'singleLineText' },
      { name: 'Mentor Name', type: 'singleLineText' },
      { name: 'Mentee Name', type: 'singleLineText' },
      { name: 'Mentor Email', type: 'singleLineText' },
      { name: 'Mentee Email', type: 'singleLineText' },
      { name: 'Status', type: 'singleSelect', options: opts(['Pending', 'Active', 'Complete']) },
      { name: 'Matched Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
      { name: 'Notes', type: 'multilineText' },
      { name: 'Shared Goals', type: 'multilineText' },
    ],
  },
  {
    name: 'CHECKINS',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Match Record ID', type: 'singleLineText' },
      { name: 'Match Name', type: 'singleLineText' },
      { name: 'Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
      { name: 'Notes', type: 'multilineText' },
      { name: 'Completed By', type: 'singleLineText' },
      { name: 'Rating', type: 'singleSelect', options: opts(['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐']) },
    ],
  },
  {
    name: 'EVENTS',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
      { name: 'Time', type: 'singleLineText' },
      { name: 'Location', type: 'singleLineText' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Type', type: 'singleSelect', options: opts(['Speed Mentoring', 'Mixer', 'Panel', 'Check-In Deadline', 'Recognition', 'Other']) },
      { name: 'Audience', type: 'singleSelect', options: opts(['All Members', 'Matched Pairs', 'Admin Only']) },
      { name: 'RSVP Count', type: 'number', options: { precision: 0 } },
    ],
  },
  {
    name: 'ANNOUNCEMENTS',
    fields: [
      { name: 'Title', type: 'singleLineText' },
      { name: 'Body', type: 'multilineText' },
      { name: 'Posted By', type: 'singleLineText' },
      { name: 'Posted Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
      { name: 'Pinned', type: 'checkbox', options: { icon: 'check', color: 'yellowBright' } },
      { name: 'Audience', type: 'singleSelect', options: opts(['Everyone', 'Mentors Only', 'Mentees Only']) },
    ],
  },
  {
    name: 'RSVPS',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Event Record ID', type: 'singleLineText' },
      { name: 'Event Name', type: 'singleLineText' },
      { name: 'Participant Record ID', type: 'singleLineText' },
      { name: 'Participant Name', type: 'singleLineText' },
      { name: 'Participant Email', type: 'singleLineText' },
      { name: 'RSVP Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
      { name: 'Status', type: 'singleSelect', options: opts(['Going', 'Not Going', 'Maybe']) },
    ],
  },
];

const SEED_EVENTS = [
  { Name: 'Speed Mentoring Lunch Event', Date: '2026-05-15', Time: '12:00 PM', Type: 'Speed Mentoring', Audience: 'All Members', Description: 'Open to all WTS-CenCal members. Rotating 10-minute sessions with program mentors. Light lunch provided. A great way to explore mentorship before applying.' },
  { Name: 'Cohort 1 Mid-Year Mixer', Date: '2026-06-10', Time: '5:30 PM', Type: 'Mixer', Audience: 'Matched Pairs', Description: 'Informal social gathering for matched pairs and program leadership. Location TBD — Downtown Fresno area.' },
  { Name: 'Mid-Year Check-In Deadline', Date: '2026-07-22', Type: 'Check-In Deadline', Audience: 'All Members', Description: 'All matched pairs should have logged at least two check-ins in the portal by this date.' },
  { Name: 'Fall Panel: Women in Transportation', Date: '2026-09-09', Time: '6:00 PM', Type: 'Panel', Audience: 'All Members', Description: 'Featured speaker panel open to all members. Topics: career pivots, leadership journeys, and industry trends.' },
  { Name: 'Cohort 2 Application Deadline', Date: '2026-10-14', Type: 'Check-In Deadline', Audience: 'All Members', Description: 'Intake forms close for the second mentorship cohort launching January 2027.' },
  { Name: 'Annual Recognition Dinner', Date: '2027-01-28', Time: '6:00 PM', Type: 'Recognition', Audience: 'All Members', Description: 'Year-end celebration honoring mentors, mentees, and program milestones. Cohort 2 launch announcement.' },
];

export async function createAllTables(token, baseId) {
  const url = `${META_URL}/${baseId}/tables`;
  const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  for (const table of TABLES) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ name: table.name, fields: table.fields }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn(`Table ${table.name} may already exist or failed:`, err.error?.message);
      }
    } catch (err) {
      console.error(`Error creating table ${table.name}:`, err);
    }
  }
}

export async function seedEvents(token, baseId) {
  const url = `https://api.airtable.com/v0/${baseId}/EVENTS`;
  const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  for (const ev of SEED_EVENTS) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ fields: ev }),
      });
    } catch (err) {
      console.error('Error seeding event:', err);
    }
  }
}

export async function seedAnnouncement(token, baseId) {
  const url = `https://api.airtable.com/v0/${baseId}/ANNOUNCEMENTS`;
  const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const today = new Date().toISOString().split('T')[0];

  try {
    await fetch(url, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({
        fields: {
          Title: 'Welcome to the 2026–27 Mentorship Program!',
          Body: "We're thrilled to launch the WTS-CenCal Mentorship Program — built from scratch this year with real structure, real matches, and real commitment to your growth. Explore the Events tab for upcoming dates, complete your profile, and reach out to Laurie Hopelian at laurie@achieveng.com with any questions. Let's make this year count.",
          Pinned: true,
          Audience: 'Everyone',
          'Posted By': 'Laurie Hopelian',
          'Posted Date': today,
        },
      }),
    });
  } catch (err) {
    console.error('Error seeding announcement:', err);
  }
}
