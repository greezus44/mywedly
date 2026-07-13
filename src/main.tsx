import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { GuestAuthProvider } from "./lib/guest-auth";
import { ErrorBoundary } from "./components/ErrorBoundary";

import Landing from "./routes/landing";
import Auth from "./routes/auth";
import Dashboard from "./routes/dashboard";
import EventLayout from "./routes/event/event-layout";
import CoverEditor from "./routes/event/cover-editor";
import LoginEditor from "./routes/event/login-editor";
import HomeEditor from "./routes/event/home-editor";
import ThemeEditor from "./routes/event/theme-editor";
import EventsEditor from "./routes/event/events";
import GuestsEditor from "./routes/event/guests";
import GroupsEditor from "./routes/event/groups";
import RsvpEditor from "./routes/event/rsvp";
import TimelineEditor from "./routes/event/timeline";
import SharingEditor from "./routes/event/sharing";
import AnalyticsEditor from "./routes/event/analytics";
import SettingsEditor from "./routes/event/settings";

import GuestLayout from "./routes/guest/guest-layout";
import GuestCover from "./routes/guest/cover";
import GuestLogin from "./routes/guest/guest-login";
import GuestHome from "./routes/guest/home";
import GuestRsvp from "./routes/guest/rsvp";
import GuestWishes from "./routes/guest/wishes";
import GuestContact from "./routes/guest/contact";

import RustyLayout from "./routes/rusty/rusty-layout";
import RustyCover from "./routes/rusty/rusty-cover";
import RustyLogin from "./routes/rusty/rusty-login";
import RustyHome from "./routes/rusty/rusty-home";
import RustyRsvp from "./routes/rusty/rusty-rsvp";
import RustyWishes from "./routes/rusty/rusty-wishes";
import RustyContact from "./routes/rusty/rusty-contact";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading...</div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GuestAuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/event/:eventId" element={<ProtectedRoute><EventLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="cover" replace />} />
                <Route path="cover" element={<CoverEditor />} />
                <Route path="login" element={<LoginEditor />} />
                <Route path="home" element={<HomeEditor />} />
                <Route path="theme" element={<ThemeEditor />} />
                <Route path="events" element={<EventsEditor />} />
                <Route path="guests" element={<GuestsEditor />} />
                <Route path="groups" element={<GroupsEditor />} />
                <Route path="rsvp" element={<RsvpEditor />} />
                <Route path="timeline" element={<TimelineEditor />} />
                <Route path="sharing" element={<SharingEditor />} />
                <Route path="analytics" element={<AnalyticsEditor />} />
                <Route path="settings" element={<SettingsEditor />} />
              </Route>
              <Route path="/e/:slug" element={<GuestLayout />}>
                <Route index element={<GuestCover />} />
                <Route path="login" element={<GuestLogin />} />
                <Route path="home" element={<GuestHome />} />
                <Route path="rsvp" element={<GuestRsvp />} />
                <Route path="wishes" element={<GuestWishes />} />
                <Route path="contact" element={<GuestContact />} />
              </Route>
              <Route path="/r/:slug" element={<RustyLayout />}>
                <Route index element={<RustyCover />} />
                <Route path="login" element={<RustyLogin />} />
                <Route path="home" element={<RustyHome />} />
                <Route path="rsvp" element={<RustyRsvp />} />
                <Route path="wishes" element={<RustyWishes />} />
                <Route path="contact" element={<RustyContact />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GuestAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
