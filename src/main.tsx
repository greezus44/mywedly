import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { ErrorBoundary } from "./components/ErrorBoundary";

import LandingPage from "./routes/landing";
import AuthPage from "./routes/auth";
import DashboardPage from "./routes/dashboard";

import EventLayoutPage from "./routes/event/event-layout";
import CoverEditorPage from "./routes/event/cover-editor";
import LoginEditorPage from "./routes/event/login-editor";
import HomeEditorPage from "./routes/event/home-editor";
import ThemeEditorPage from "./routes/event/theme-editor";
import EventsPage from "./routes/event/events";
import GuestsPage from "./routes/event/guests";
import GroupsPage from "./routes/event/groups";
import RsvpPage from "./routes/event/rsvp";
import TimelinePage from "./routes/event/timeline";
import SharingPage from "./routes/event/sharing";
import AnalyticsPage from "./routes/event/analytics";
import SettingsPage from "./routes/event/settings";

import GuestLayoutPage from "./routes/guest/guest-layout";
import GuestCoverPage from "./routes/guest/cover";
import GuestLoginPage from "./routes/guest/guest-login";
import GuestHomePage from "./routes/guest/home";
import GuestRsvpPage from "./routes/guest/rsvp";
import GuestWishesPage from "./routes/guest/wishes";
import GuestContactPage from "./routes/guest/contact";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-sm text-gray-400">Loading...</div></div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/event/:eventId" element={<ProtectedRoute><EventLayoutPage /></ProtectedRoute>}>
              <Route index element={<Navigate to="cover" replace />} />
              <Route path="cover" element={<CoverEditorPage />} />
              <Route path="login" element={<LoginEditorPage />} />
              <Route path="home" element={<HomeEditorPage />} />
              <Route path="theme" element={<ThemeEditorPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="guests" element={<GuestsPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="rsvp" element={<RsvpPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="sharing" element={<SharingPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/e/:slug" element={<GuestLayoutPage />}>
              <Route index element={<GuestCoverPage />} />
              <Route path="login" element={<GuestLoginPage />} />
              <Route path="home" element={<GuestHomePage />} />
              <Route path="rsvp" element={<GuestRsvpPage />} />
              <Route path="wishes" element={<GuestWishesPage />} />
              <Route path="contact" element={<GuestContactPage />} />
            </Route>
            <Route path="/r/:slug" element={<GuestLayoutPage />}>
              <Route index element={<GuestCoverPage />} />
              <Route path="login" element={<GuestLoginPage />} />
              <Route path="home" element={<GuestHomePage />} />
              <Route path="rsvp" element={<GuestRsvpPage />} />
              <Route path="wishes" element={<GuestWishesPage />} />
              <Route path="contact" element={<GuestContactPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
