import React from 'react';
import { Download, ExternalLink } from 'lucide-react';

const DOCS = [
  {
    icon: '📋',
    title: 'Program Handbook',
    description: 'Your complete guide to the 2026–27 mentorship program — expectations, timeline, matching process, and how to make the most of your partnership.',
    file: '/resources/wts-program-handbook.docx',
  },
  {
    icon: '🎯',
    title: 'Goal-Setting Worksheet',
    description: 'A structured fillable template for your first meeting. Helps mentors and mentees align on goals, communication style, and meeting cadence.',
    file: '/resources/wts-goal-setting-worksheet.docx',
  },
  {
    icon: '📅',
    title: 'Meeting Agenda Template',
    description: 'A 7-block agenda framework for every check-in. Keeps meetings focused and ensures nothing important gets skipped. Includes space for notes.',
    file: '/resources/wts-meeting-agenda-template.docx',
  },
];

const LINKS = [
  {
    title: 'WTS International',
    url: 'https://www.wtsinternational.org',
    description: 'National resources, scholarships, and the annual conference.',
    domain: 'wtsinternational.org',
  },
  {
    title: 'WTS-CenCal LinkedIn',
    url: 'https://www.linkedin.com/company/wts-central-california-chapter/?viewAsMember=true',
    description: "Follow our chapter's official LinkedIn page for events and member spotlights.",
    domain: 'linkedin.com',
  },
  {
    title: 'WTS Scholarship Program',
    url: 'https://www.wtsinternational.org/chapters/central-california/scholarships',
    description: 'Foundation scholarships for women studying transportation. Applications open each fall.',
    domain: 'wtsinternational.org',
  },
  {
    title: 'WTS-CenCal Chapter Page',
    url: 'https://www.wtsinternational.org/chapters/central-california',
    description: 'Official chapter page with events, leadership info, and membership details.',
    domain: 'wtsinternational.org',
  },
];

export default function ResourcesPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>Resources</h1>
        <p className="text-sm mt-1" style={{ color: '#6b6560' }}>Program documents and helpful links for your mentorship journey</p>
      </div>

      <section className="mb-10">
        <h2 className="text-base font-semibold mb-4" style={{ color: '#0a1f3c' }}>Program Documents</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {DOCS.map(doc => (
            <div key={doc.title} className="bg-white rounded-xl border p-5 flex flex-col hover:shadow-md transition-shadow" style={{ borderColor: '#e4dfd5' }}>
              <div className="text-3xl mb-3">{doc.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: '#0a1f3c', fontFamily: "'Playfair Display', serif" }}>{doc.title}</h3>
              <p className="text-sm flex-1 mb-4" style={{ color: '#6b6560', lineHeight: 1.6 }}>{doc.description}</p>
              <a
                href={doc.file}
                download
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white w-full"
                style={{ background: '#0a1f3c' }}
              >
                <Download size={14} /> Download
              </a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: '#0a1f3c' }}>WTS Links</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {LINKS.map(link => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border p-4 flex items-start gap-4 hover:shadow-md transition-all group"
              style={{ borderColor: '#e4dfd5', textDecoration: 'none' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#faf7f2', border: '1px solid #e4dfd5' }}>
                <ExternalLink size={17} style={{ color: '#1a6b6e' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-0.5 group-hover:underline" style={{ color: '#0a1f3c' }}>{link.title}</p>
                <p className="text-xs mb-1.5" style={{ color: '#9d948b' }}>{link.domain}</p>
                <p className="text-xs" style={{ color: '#6b6560', lineHeight: 1.5 }}>{link.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
