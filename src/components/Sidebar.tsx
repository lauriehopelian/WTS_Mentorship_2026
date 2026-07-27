import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Link2, ClipboardList, Calendar, CalendarDays, Megaphone, BookOpen, Settings, LogOut, ChevronLeft, ChevronRight, CircleUser as UserCircle, Heart } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Participants', path: '/participants', icon: Users },
  { label: 'Matches', path: '/matches', icon: Link2 },
  { label: 'Check-Ins', path: '/checkins', icon: ClipboardList },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Announcements', path: '/announcements', icon: Megaphone },
  { label: 'Resources', path: '/resources', icon: BookOpen },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const mentorNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Match', path: '/my-match', icon: Heart },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Announcements', path: '/announcements', icon: Megaphone },
  { label: 'Resources', path: '/resources', icon: BookOpen },
  { label: 'My Profile', path: '/profile', icon: UserCircle },
];

const menteeNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Match', path: '/my-match', icon: Heart },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Announcements', path: '/announcements', icon: Megaphone },
  { label: 'Resources', path: '/resources', icon: BookOpen },
  { label: 'My Profile', path: '/profile', icon: UserCircle },
];

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const nav = role === 'admin' ? adminNav : role === 'Mentor' ? mentorNav : menteeNav;

  function handleLogout() {
    localStorage.removeItem('wts_user');
    localStorage.removeItem('wts_role');
    navigate('/login');
  }

  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0`}
        style={{ width: collapsed ? 64 : 220, background: '#0f2744', minHeight: '100vh' }}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {!collapsed && (
            <div className="flex flex-col gap-1">
              <img
                src="/WTS_Central_California_Stacked_White.png"
                alt="WTS Central California"
                className="h-10 w-auto object-contain"
                style={{ maxWidth: 140 }}
              />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Mentorship Portal</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10 ml-auto"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-sm font-medium group ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/8'
                  }`
                }
                style={({ isActive }) => isActive ? { background: 'rgba(77,184,200,0.15)', color: '#4db8c8' } : {}}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-2 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 w-full text-sm font-medium transition-colors text-white/40 hover:text-white hover:bg-white/8"
            title={collapsed ? 'Log Out' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 pb-safe"
        style={{ background: '#0f2744', borderColor: 'rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 0)', minHeight: 60 }}>
        {nav.slice(0, 5).map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors text-xs font-medium ${isActive ? '' : 'text-white/45 hover:text-white'}`
              }
              style={({ isActive }) => isActive ? { color: '#4db8c8' } : {}}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
