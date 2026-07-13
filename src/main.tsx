import { useState, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Route pages
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

// ---------------------------------------------------------------------------
// Query client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

function ProtectedRoute(): ReactNode {
  const [authState, setAuthState] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    // Also check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App(): ReactNode {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Dashboard (protected) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* Event editor (protected) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/event/:eventId" element={<EventLayoutPage />}>
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
                <Route path="stats" element={<AnalyticsPage />} />
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}
createRoot(rootEl).render(<App />);
