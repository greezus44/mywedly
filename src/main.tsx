import "./index.css";
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import { supabase, type UserEvent } from "./lib/supabase";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./routes/landing"));
const AuthPage = lazy(() => import("./routes/auth"));
const DashboardPage = lazy(() => import("./routes/dashboard"));
const EventLayoutPage = lazy(() => import("./routes/event/event-layout"));
const EventCoverEditor = lazy(() => import("./routes/event/cover-editor"));
const EventLoginEditor = lazy(() => import("./routes/event/login-editor"));
const EventHomeEditor = lazy(() => import("./routes/event/home-editor"));
const EventThemeEditor = lazy(() => import("./routes/event/theme-editor"));
const EventBranding = lazy(() => import("./routes/event/branding"));
const EventEvents = lazy(() => import("./routes/event/events"));
const EventGuests = lazy(() => import("./routes/event/guests"));
const EventGroups = lazy(() => import("./routes/event/groups"));
const EventRsvp = lazy(() => import("./routes/event/rsvp"));
const EventTimeline = lazy(() => import("./routes/event/timeline"));
const EventSharing = lazy(() => import("./routes/event/sharing"));
const EventAnalytics = lazy(() => import("./routes/event/analytics"));
const EventSettings = lazy(() => import("./routes/event/settings"));

// Guest (default template) pages
const GuestLayout = lazy(() => import("./routes/guest/guest-layout"));
const GuestCover = lazy(() => import("./routes/guest/cover"));
const GuestLogin = lazy(() => import("./routes/guest/guest-login"));
const GuestHome = lazy(() => import("./routes/guest/home"));
const GuestRsvp = lazy(() => import("./routes/guest/rsvp"));
const GuestWishes = lazy(() => import("./routes/guest/wishes"));
const GuestContact = lazy(() => import("./routes/guest/contact"));

// Rusty template pages
const RustyLayout = lazy(() => import("./routes/rusty/rusty-layout"));
const RustyCover = lazy(() => import("./routes/rusty/rusty-cover"));
const RustyLogin = lazy(() => import("./routes/rusty/rusty-login"));
const RustyHome = lazy(() => import("./routes/rusty/rusty-home"));
const RustyRsvp = lazy(() => import("./routes/rusty/rusty-rsvp"));
const RustyWishes = lazy(() => import("./routes/rusty/rusty-wishes"));
const RustyContact = lazy(() => import("./routes/rusty/rusty-contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const suspenseFallback = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-200 border-t-black animate-spin" />
  </div>
);

/**
 * TemplateRouter — fetches the event by slug and renders the appropriate
 * template's layout + nested routes based on event.template_id.
 */
function TemplateRouter() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Fetch the event by slug to determine which template to render
  const [resolvedEvent, setResolvedEvent] = React.useState<UserEvent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }
      try {
        // Try slug directly
        const { data: bySlug, error: errSlug } = await supabase
          .from("user_events")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (errSlug) throw errSlug;
        if (bySlug && !cancelled) {
          setResolvedEvent(bySlug as UserEvent);
          setLoading(false);
          return;
        }
        // Try redirects
        const { data: redirect, error: errRedirect } = await supabase
          .from("event_slug_redirects")
          .select("event_id")
          .eq("slug", slug)
          .maybeSingle();
        if (errRedirect) throw errRedirect;
        if (!redirect) {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
          return;
        }
        const { data: byId, error: errId } = await supabase
          .from("user_events")
          .select("*")
          .eq("id", redirect.event_id)
          .maybeSingle();
        if (errId) throw errId;
        if (!cancelled) {
          setResolvedEvent((byId as UserEvent) || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return suspenseFallback;
  }

  if (error || !resolvedEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="font-heading text-3xl mb-3">Invitation Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The invitation you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-black text-white text-sm uppercase tracking-wider"
          style={{ borderRadius: "var(--radius)" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const isRusty = resolvedEvent.template_id === "rusty";

  if (isRusty) {
    return (
      <Routes>
        <Route element={<RustyLayout />}>
          <Route index element={<Navigate to="cover" replace />} />
          <Route path="cover" element={<RustyCover />} />
          <Route path="login" element={<RustyLogin />} />
          <Route path="home" element={<RustyHome />} />
          <Route path="rsvp" element={<RustyRsvp />} />
          <Route path="wishes" element={<RustyWishes />} />
          <Route path="contact" element={<RustyContact />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route index element={<Navigate to="cover" replace />} />
        <Route path="cover" element={<GuestCover />} />
        <Route path="login" element={<GuestLogin />} />
        <Route path="home" element={<GuestHome />} />
        <Route path="rsvp" element={<GuestRsvp />} />
        <Route path="wishes" element={<GuestWishes />} />
        <Route path="contact" element={<GuestContact />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <BrowserRouter>
            <Suspense fallback={suspenseFallback}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Event editor (dashboard) */}
                <Route path="/event/:eventId" element={<EventLayoutPage />}>
                  <Route index element={<Navigate to="cover" replace />} />
                  <Route path="cover" element={<EventCoverEditor />} />
                  <Route path="login" element={<EventLoginEditor />} />
                  <Route path="home" element={<EventHomeEditor />} />
                  <Route path="theme" element={<EventThemeEditor />} />
                  <Route path="branding" element={<EventBranding />} />
                  <Route path="events" element={<EventEvents />} />
                  <Route path="guests" element={<EventGuests />} />
                  <Route path="groups" element={<EventGroups />} />
                  <Route path="rsvp" element={<EventRsvp />} />
                  <Route path="timeline" element={<EventTimeline />} />
                  <Route path="sharing" element={<EventSharing />} />
                  <Route path="analytics" element={<EventAnalytics />} />
                  <Route path="settings" element={<EventSettings />} />
                </Route>

                {/* Public guest-facing invitation */}
                <Route path="/e/:slug" element={<TemplateRouter />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </GuestAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
