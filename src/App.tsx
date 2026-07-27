import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import Toast from './components/Toast';
import Layout from './components/Layout';
import { supabase } from './lib/supabase';
import { PageLoader } from './components/LoadingSpinner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RsvpPage from './pages/RsvpPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ParticipantDashboard from './pages/dashboard/ParticipantDashboard';
import ParticipantsPage from './pages/participants/ParticipantsPage';
import MatchesPage from './pages/matches/MatchesPage';
import CheckInsPage from './pages/checkins/CheckInsPage';
import EventsPage from './pages/events/EventsPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import ResourcesPage from './pages/resources/ResourcesPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import MyMatchPage from './pages/mymatch/MyMatchPage';
import CalendarPage from './pages/calendar/CalendarPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: 'Mentor' | 'Mentee';
  is_admin: boolean;
  participant_id: string;
  avatar_color: string;
  initials: string;
};

const AppUserContext = React.createContext<AppUser | null>(null);
export function useAppUser() { return React.useContext(AppUserContext); }

function AuthRequired({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const user = React.useContext(AppUserContext);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const user = React.useContext(AppUserContext);
  const role = user?.is_admin ? 'admin' : (user?.role?.toLowerCase() || 'mentee');
  return <Layout role={role}>{children}</Layout>;
}

function DashboardRoute() {
  const user = React.useContext(AppUserContext);
  if (user?.is_admin) return <AdminDashboard />;
  return <ParticipantDashboard />;
}

export default function App() {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadParticipant(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAppUser(null);
        setLoading(false);
      } else if (session?.user) {
        loadParticipant(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadParticipant(authUserId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('participants')
      .select('id, email, name, role, is_admin, avatar_color, initials')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (data) {
      setAppUser({
        id: authUserId,
        email: data.email,
        name: data.name,
        role: data.role,
        is_admin: data.is_admin,
        participant_id: data.id,
        avatar_color: data.avatar_color,
        initials: data.initials,
      });
    }
    setLoading(false);
  }

  if (loading) return <PageLoader />;

  return (
    <AppUserContext.Provider value={appUser}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={appUser ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setAppUser} />} />
            <Route path="/register" element={appUser ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
            <Route path="/rsvp" element={<RsvpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={
              <AuthRequired><AppLayout><DashboardRoute /></AppLayout></AuthRequired>
            } />
            <Route path="/participants" element={
              <AuthRequired adminOnly><AppLayout><ParticipantsPage /></AppLayout></AuthRequired>
            } />
            <Route path="/matches" element={
              <AuthRequired adminOnly><AppLayout><MatchesPage /></AppLayout></AuthRequired>
            } />
            <Route path="/checkins" element={
              <AuthRequired adminOnly><AppLayout><CheckInsPage /></AppLayout></AuthRequired>
            } />
            <Route path="/events" element={
              <AuthRequired><AppLayout><EventsPage /></AppLayout></AuthRequired>
            } />
            <Route path="/announcements" element={
              <AuthRequired><AppLayout><AnnouncementsPage /></AppLayout></AuthRequired>
            } />
            <Route path="/resources" element={
              <AuthRequired><AppLayout><ResourcesPage /></AppLayout></AuthRequired>
            } />
            <Route path="/profile" element={
              <AuthRequired><AppLayout><ProfilePage /></AppLayout></AuthRequired>
            } />
            <Route path="/settings" element={
              <AuthRequired adminOnly><AppLayout><SettingsPage /></AppLayout></AuthRequired>
            } />
            <Route path="/my-match" element={
              <AuthRequired><AppLayout><MyMatchPage /></AppLayout></AuthRequired>
            } />
            <Route path="/calendar" element={
              <AuthRequired><AppLayout><CalendarPage /></AppLayout></AuthRequired>
            } />
            <Route path="/" element={
              appUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toast />
      </ToastProvider>
    </AppUserContext.Provider>
  );
}
