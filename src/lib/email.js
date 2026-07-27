import { supabase } from './supabase';

const RESEND_URL = 'https://api.resend.com/emails';

function emailTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #0a1f3c; padding: 28px 40px; text-align: center; }
    .header-title { color: #c8922a; font-size: 22px; font-weight: 700; letter-spacing: 2px; margin: 0; }
    .header-sub { color: #8fa8c8; font-size: 13px; margin: 4px 0 0; letter-spacing: 1px; }
    .body { padding: 40px; color: #2d2d2d; line-height: 1.6; }
    .body h2 { color: #0a1f3c; font-size: 22px; margin-top: 0; }
    .body p { color: #444; font-size: 15px; }
    .cta-btn { display: inline-block; background: #c8922a; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .detail-block { background: #faf7f2; border: 1px solid #e4dfd5; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-block p { margin: 6px 0; font-size: 14px; color: #555; }
    .detail-block strong { color: #0a1f3c; }
    .footer { background: #f0ebe2; padding: 24px 40px; text-align: center; border-top: 1px solid #e4dfd5; }
    .footer p { color: #6b6560; font-size: 12px; margin: 0; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">WTS · Central California</p>
      <p class="header-sub">Mentorship Program</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>WTS-CenCal Mentorship Program · Central California · 2026–27 Program Year<br>
      Questions? Contact <a href="mailto:laurie@achieveng.com" style="color:#1a6b6e;">laurie@achieveng.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

async function getEmailConfig() {
  const { data } = await supabase.from('app_config').select('key, value').in('key', ['wts_resend_key', 'wts_from_email', 'wts_app_url']);
  const cfg = {};
  (data || []).forEach(row => { cfg[row.key] = row.value; });
  return cfg;
}

async function sendEmail(to, subject, html) {
  const cfg = await getEmailConfig();
  const resendKey = cfg['wts_resend_key'];
  const fromEmail = cfg['wts_from_email'];
  if (!resendKey || !fromEmail) throw new Error('Missing Resend credentials. Configure them in Settings.');

  let res;
  try {
    res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: 'laurie@achieveng.com',
      }),
    });
  } catch {
    throw new Error('Email could not be sent. Check your Resend API key in Settings.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Email could not be sent. Check your Resend API key in Settings. (${err.message || res.statusText})`);
  }
  return res.json();
}

export async function sendWelcomeEmail(participant) {
  const cfg = await getEmailConfig();
  const appUrl = cfg['wts_app_url'] || '';
  const firstName = participant.name?.split(' ')[0] || participant.name;
  const role = participant.role;
  const content = `
    <h2>Welcome to WTS-CenCal Mentorship, ${firstName}!</h2>
    <p>Congratulations! You've been accepted into the <strong>2026–27 WTS-CenCal Mentorship Program</strong> as a <strong>${role}</strong>.</p>
    <p>${role === 'Mentor' ? 'As a mentor, you\'ll have the opportunity to share your experience, guide a colleague, and give back to our transportation community.' : 'As a mentee, you\'ll gain access to personalized guidance, professional insights, and a dedicated mentor invested in your growth.'}</p>
    <h3 style="color:#0a1f3c;">Your Next Steps</h3>
    <ul>
      <li>Log into the portal and complete your profile</li>
      <li>Watch for your match notification email — introductions go out soon</li>
      <li>Download the Program Handbook from the Resources section</li>
    </ul>
    <a href="${appUrl}/login" class="cta-btn">Log In to the Portal</a>
    <p style="font-size:13px;color:#6b6560;">Questions? Reach out to Laurie Hopelian at <a href="mailto:laurie@achieveng.com">laurie@achieveng.com</a></p>
  `;
  return sendEmail(participant.email, `Welcome to WTS-CenCal Mentorship, ${firstName}!`, emailTemplate(content));
}

export async function sendMatchEmailToMentor(mentor, mentee) {
  const cfg = await getEmailConfig();
  const appUrl = cfg['wts_app_url'] || '';
  const menteeName = mentee.name;
  const content = `
    <h2>You've been matched! Meet your mentee, ${menteeName}</h2>
    <p>We're excited to introduce you to your mentee for the 2026–27 program year. Here's what you need to know about them:</p>
    <div class="detail-block">
      <p><strong>Name:</strong> ${menteeName}</p>
      ${mentee.title ? `<p><strong>Title:</strong> ${mentee.title}</p>` : ''}
      ${mentee.organization ? `<p><strong>Organization:</strong> ${mentee.organization}</p>` : ''}
      ${mentee.career_stage ? `<p><strong>Career Stage:</strong> ${mentee.career_stage}</p>` : ''}
      ${mentee.primary_field ? `<p><strong>Primary Field:</strong> ${mentee.primary_field}</p>` : ''}
      ${mentee.guidance_areas?.length ? `<p><strong>Areas Seeking Guidance:</strong> ${mentee.guidance_areas.join(', ')}</p>` : ''}
      ${mentee.goals?.length ? `<p><strong>Top Goals:</strong> ${mentee.goals.join(', ')}</p>` : ''}
    </div>
    <p><strong>Suggested first step:</strong> Reach out to schedule your first meeting and download the Goal-Setting Worksheet from the portal's Resources section.</p>
    <a href="${appUrl}/dashboard" class="cta-btn">View Your Match in the Portal</a>
  `;
  return sendEmail(mentor.email, `You've been matched! Meet your mentee, ${menteeName}`, emailTemplate(content));
}

export async function sendMatchEmailToMentee(mentee, mentor) {
  const cfg = await getEmailConfig();
  const appUrl = cfg['wts_app_url'] || '';
  const mentorName = mentor.name;
  const content = `
    <h2>You've been matched! Meet your mentor, ${mentorName}</h2>
    <p>We're thrilled to introduce you to your mentor for the 2026–27 program year. Here's a bit about them:</p>
    <div class="detail-block">
      <p><strong>Name:</strong> ${mentorName}</p>
      ${mentor.title ? `<p><strong>Title:</strong> ${mentor.title}</p>` : ''}
      ${mentor.organization ? `<p><strong>Organization:</strong> ${mentor.organization}</p>` : ''}
      ${mentor.career_stage ? `<p><strong>Career Stage:</strong> ${mentor.career_stage}</p>` : ''}
      ${mentor.primary_field ? `<p><strong>Primary Field:</strong> ${mentor.primary_field}</p>` : ''}
      ${mentor.guidance_areas?.length ? `<p><strong>Areas of Guidance:</strong> ${mentor.guidance_areas.join(', ')}</p>` : ''}
    </div>
    <p><strong>Suggested first step:</strong> Reach out to your mentor to schedule your first meeting — you drive the schedule! Use the Goal-Setting Worksheet in the portal's Resources section to prepare.</p>
    <a href="${appUrl}/dashboard" class="cta-btn">View Your Match in the Portal</a>
  `;
  return sendEmail(mentee.email, `You've been matched! Meet your mentor, ${mentorName}`, emailTemplate(content));
}

export async function sendEventAnnouncementEmail(recipients, subject, customBody, event) {
  const cfg = await getEmailConfig();
  const appUrl = cfg['wts_app_url'] || '';
  const promises = recipients.map(participant => {
    const rsvpLink = `${appUrl}/rsvp?event=${event.id}&participant=${participant.id}`;
    const content = `
      <h2>${event.name}</h2>
      <p>${customBody}</p>
      <div class="detail-block">
        <p><strong>Date:</strong> ${formatDate(event.event_date)}</p>
        ${event.event_time ? `<p><strong>Time:</strong> ${event.event_time}</p>` : ''}
        ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
        ${event.description ? `<p><strong>About:</strong> ${event.description}</p>` : ''}
      </div>
      <a href="${rsvpLink}" class="cta-btn">RSVP Now</a>
    `;
    return sendEmail(participant.email, subject, emailTemplate(content)).catch(err => {
      console.error(`Failed to send to ${participant.email}:`, err);
    });
  });
  return Promise.all(promises);
}

export async function sendAnnouncementBlastEmail(recipients, announcement) {
  const cfg = await getEmailConfig();
  const appUrl = cfg['wts_app_url'] || '';
  const content = `
    <h2>${announcement.title}</h2>
    <div style="white-space:pre-line;font-size:15px;color:#444;line-height:1.7;">${announcement.body}</div>
    <a href="${appUrl}/dashboard" class="cta-btn">View in Portal</a>
  `;
  const promises = recipients.map(participant =>
    sendEmail(participant.email, announcement.title, emailTemplate(content)).catch(err => {
      console.error(`Failed to send to ${participant.email}:`, err);
    })
  );
  return Promise.all(promises);
}

export async function sendCheckInReminderEmail(mentor, mentee) {
  const cfg = await getEmailConfig();
  const appUrl = cfg['wts_app_url'] || '';
  const promises = [
    { participant: mentor, partner: mentee, partnerRole: 'mentee' },
    { participant: mentee, partner: mentor, partnerRole: 'mentor' },
  ].map(({ participant, partner, partnerRole }) => {
    const firstName = participant.name?.split(' ')[0];
    const content = `
      <h2>Time for your mentorship check-in!</h2>
      <p>Hi ${firstName},</p>
      <p>It's time to connect with your ${partnerRole}, <strong>${partner.name}</strong>!</p>
      <p>The program goal is <strong>4 check-ins</strong> over the course of the year. Each check-in helps you build momentum, stay accountable, and make the most of this partnership.</p>
      <p>Log your check-in in the portal after your next meeting to keep your progress on track.</p>
      <a href="${appUrl}/dashboard" class="cta-btn">Log Your Check-In</a>
    `;
    return sendEmail(
      participant.email,
      'Time for your mentorship check-in',
      emailTemplate(content)
    ).catch(err => console.error(`Failed to send to ${participant.email}:`, err));
  });
  return Promise.all(promises);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
