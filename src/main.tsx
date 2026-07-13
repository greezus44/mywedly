import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import { LoadingSpinner } from "./components/ui";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

/* ── Protected Route ───────────────────────────────── */

function ProtectedRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setAuthenticated(true);
        setChecking(false);
      } else {
        setAuthenticated(false);
        setChecking(false);
        navigate("/auth");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        if (session) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          navigate("/auth");
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <Outlet />;
}

/* ── Lazy-ish imports (static for simplicity) ──────── */

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
import RustyLayoutPage from "./routes/rusty/rusty-layout";
import RustyCoverPage from "./routes/rusty/rusty-cover";
import RustyLoginPage from "./routes/rusty/rusty-login";
import RustyHomePage from "./routes/rusty/rusty-home";
import RustyRsvpPage from "./routes/rusty/rusty-rsvp";
import RustyWishesPage from "./routes/rusty/rusty-wishes";
import RustyContactPage from "./routes/rusty/rusty-contact";

/* ── App Routes ────────────────────────────────────── */

function AppRoutes() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute />}
      >
        <Route index element={<DashboardPage />} />
      </Route>

      {/* Event editor (protected) */}
      <Route
        path="/event/:eventId"
        element={<ProtectedRoute />}
      >
        <Route element={<EventLayoutPage />}>
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
      </Route>

      {/* Guest view */}
      <Route path="/e/:slug" element={<GuestLayoutPage />}>
        <Route index element={<GuestCoverPage />} />
        <Route path="login" element={<GuestLoginPage />} />
        <Route path="home" element={<GuestHomePage />} />
        <Route path="rsvp" element={<GuestRsvpPage />} />
        <Route path="wishes" element={<GuestWishesPage />} />
        <Route path="contact" element={<GuestContactPage />} />
      </Route>

      {/* Rusty view */}
      <Route path="/r/:slug" element={<RustyLayoutPage />}>
        <Route index element={<RustyCoverPage />} />
        <Route path="login" element={<RustyLoginPage />} />
        <Route path="home" element={<RustyHomePage />} />
        <Route path="rsvp" element={<RustyRsvpPage />} />
        <Route path="wishes" element={<RustyWishesPage />} />
        <Route path="contact" element={<RustyContactPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Main() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GuestAuthProvider>
            <AppRoutes />
          </GuestAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
