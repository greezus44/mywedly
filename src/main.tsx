import { Component, useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { ToastProvider } from "./components/ui";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

/* ------------------------------------------------------------------ */
/* ErrorBoundary                                                        */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-500">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* ProtectedRoute                                                       */
/* ------------------------------------------------------------------ */

function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/auth", { replace: true });
      } else {
        setAuthed(true);
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return authed ? <>{children}</> : null;
}

/* ------------------------------------------------------------------ */
/* App routes                                                           */
/* ------------------------------------------------------------------ */

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:eventId"
        element={
          <ProtectedRoute>
            <EventLayoutPage />
          </ProtectedRoute>
        }
      >
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
      <Route path="/e/:slug" element={<GuestLayoutPage />}>
        <Route index element={<GuestCoverPage />} />
        <Route path="login" element={<GuestLoginPage />} />
        <Route path="home" element={<GuestHomePage />} />
        <Route path="rsvp" element={<GuestRsvpPage />} />
        <Route path="wishes" element={<GuestWishesPage />} />
        <Route path="contact" element={<GuestContactPage />} />
      </Route>
      <Route path="/r/:slug" element={<RustyLayoutPage />}>
        <Route index element={<GuestCoverPage />} />
        <Route path="login" element={<GuestLoginPage />} />
        <Route path="home" element={<GuestHomePage />} />
        <Route path="rsvp" element={<GuestRsvpPage />} />
        <Route path="wishes" element={<GuestWishesPage />} />
        <Route path="contact" element={<GuestContactPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
