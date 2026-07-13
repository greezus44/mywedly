import "./index.css";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import { supabase, type UserEvent, type SlugRedirect } from "./lib/supabase";

// Lazy-loaded pages
const LandingPage = React.lazy(() => import("./routes/landing"));
const AuthPage = React.lazy(() => import("./routes/auth"));
const DashboardPage = React.lazy(() => import("./routes/dashboard"));
const EventLayoutPage = React.lazy(() => import("./routes/event/event-layout"));

// Dashboard editor sub-pages (nested under /event/:eventId)
const CoverEditorPage = React.lazy(() => import("./routes/event/cover-editor"));
const LoginEditorPage = React.lazy(() => import("./routes/event/login-editor"));
const HomeEditorPage = React.lazy(() => import("./routes/event/home-editor"));
const ThemeEditorPage = React.lazy(() => import("./routes/event/theme-editor"));
const BrandingPage = React.lazy(() => import("./routes/event/branding"));
const GuestsPage = React.lazy(() => import("./routes/event/guests"));
const RsvpEditorPage = React.lazy(() => import("./routes/event/rsvp"));
const TimelinePage = React.lazy(() => import("./routes/event/timeline"));
const SharingPage = React.lazy(() => import("./routes/event/sharing"));
const AnalyticsPage = React.lazy(() => import("./routes/event/analytics"));
const SettingsPage = React.lazy(() => import("./routes/event/settings"));

// Rusty template pages
const RustyLayout = React.lazy(() => import("./routes/rusty/rusty-layout"));
const RustyCover = React.lazy(() => import("./routes/rusty/rusty-cover"));
const RustyLogin = React.lazy(() => import("./routes/rusty/rusty-login"));
const RustyHome = React.lazy(() => import("./routes/rusty/rusty-home"));
const RustyRsvp = React.lazy(() => import("./routes/rusty/rusty-rsvp"));
const RustyWishes = React.lazy(() => import("./routes/rusty/rusty-wishes"));
const RustyContact = React.lazy(() => import("./routes/rusty/rusty-contact"));

// Default guest template pages
const GuestLayout = React.lazy(() => import("./routes/guest/guest-layout"));
const GuestCover = React.lazy(() => import("./routes/guest/cover"));
const GuestLogin = React.lazy(() => import("./routes/guest/guest-login"));
const GuestHome = React.lazy(() => import("./routes/guest/home"));
const GuestRsvp = React.lazy(() => import("./routes/guest/rsvp"));
const GuestWishes = React.lazy(() => import("./routes/guest/wishes"));
const GuestContact = React.lazy(() => import("./routes/guest/contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Fetch an event by slug (or uuid) from the user_events table, checking the
 * `slug` field, then `draft_slug`, then `id`, and finally the
 * `event_slug_redirects` table. Mirrors the logic in GuestLayout so the
 * TemplateRouter can decide which template to render before the layout's own
 * query kicks in.
 */
async function fetchEventForRouting(slug: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .or(`slug.eq.${slug},draft_slug.eq.${slug},id.eq.${slug}`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as UserEvent;

  const { data: redirect, error: redirectError } = await supabase
    .from("event_slug_redirects")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (redirectError) throw redirectError;
  if (redirect) {
    const redirectRow = redirect as SlugRedirect;
    const { data: redirected, error: redirectedError } = await supabase
      .from("user_events")
      .select("*")
      .eq("id", redirectRow.event_id)
      .maybeSingle();
    if (redirectedError) throw redirectedError;
    if (redirected) return redirected as UserEvent;
  }

  return null;
}

/**
 * TemplateRouter — fetches the event by :slug, then renders either the Rusty
 * template (if event.template_id === "rusty") or the default Guest template.
 * Each template gets its own layout + nested routes using the /e/:slug pattern.
 */
function TemplateRouter() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [state, setState] = React.useState<{
    loading: boolean;
    templateId: string | null;
    eventSlug: string | null;
    error: boolean;
  }>({ loading: true, templateId: null, eventSlug: null, error: false });

  React.useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ loading: false, templateId: null, eventSlug: null, error: true });
      return;
    }
    setState({ loading: true, templateId: null, eventSlug: null, error: false });
    fetchEventForRouting(slug)
      .then((event) => {
        if (cancelled) return;
        if (!event) {
          setState({ loading: false, templateId: null, eventSlug: null, error: true });
          return;
        }
        // Prefer the event's published slug for nested route paths, fall back
        // to the incoming slug, then the event id.
        const eventSlug = event.slug || slug || event.id;
        setState({
          loading: false,
          templateId: event.template_id || "default",
          eventSlug,
          error: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, templateId: null, eventSlug: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-onyx/40" />
      </div>
    );
  }

  if (state.error || !state.eventSlug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-cream text-onyx px-6 text-center">
        <p className="font-heading text-3xl">Invitation Not Found</p>
        <p className="text-sm text-onyx/50 max-w-sm">
          We could not locate the invitation you are looking for. Please check
          your link and try again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2.5 bg-onyx text-cream text-sm uppercase tracking-wider"
        >
          Go Home
        </button>
      </div>
    );
  }

  const s = state.eventSlug;

  if (state.templateId === "rusty") {
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
          <Route path="*" element={<Navigate to="cover" replace />} />
        </Route>
      </Routes>
    );
  }

  // Default guest template
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
        <Route path="*" element={<Navigate to="cover" replace />} />
      </Route>
    </Routes>
  );
}

const PageLoader = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-onyx/20 border-t-onyx animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <BrowserRouter>
            <Suspense fallback={PageLoader}>
              <Routes>
                {/* Public marketing pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Event editor (creator-facing) */}
                <Route path="/event/:eventId" element={<EventLayoutPage />}>
                  <Route index element={<Navigate to="cover" replace />} />
                  <Route path="cover" element={<CoverEditorPage />} />
                  <Route path="login" element={<LoginEditorPage />} />
                  <Route path="home" element={<HomeEditorPage />} />
                  <Route path="theme" element={<ThemeEditorPage />} />
                  <Route path="branding" element={<BrandingPage />} />
                  <Route path="guests" element={<GuestsPage />} />
                  <Route path="rsvp" element={<RsvpEditorPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="sharing" element={<SharingPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Guest-facing event site (by slug) */}
                <Route path="/e/:slug" element={<TemplateRouter />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </GuestAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
