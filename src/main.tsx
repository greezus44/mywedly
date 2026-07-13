import React, { Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase, type UserEvent } from "./lib/supabase";
import { GuestAuthProvider } from "./lib/guest-auth";

// ─── Eager imports ───────────────────────────────────────────────────────────
import EventLayout from "./routes/event/event-layout";
import GuestLayout from "./routes/guest/guest-layout";
import { RustyLayout } from "./routes/rusty/rusty-layout";

// ─── Lazy imports: top-level pages ───────────────────────────────────────────
const Landing = React.lazy(() => import("./routes/landing"));
const Auth = React.lazy(() => import("./routes/auth"));
const Dashboard = React.lazy(() => import("./routes/dashboard"));

// ─── Lazy imports: event editor sub-routes ───────────────────────────────────
const CoverEditor = React.lazy(() => import("./routes/event/cover-editor"));
const LoginEditor = React.lazy(() => import("./routes/event/login-editor"));
const HomeEditor = React.lazy(() => import("./routes/event/home-editor"));
const ThemeEditor = React.lazy(() => import("./routes/event/theme-editor"));
const Branding = React.lazy(() => import("./routes/event/branding"));
const Guests = React.lazy(() => import("./routes/event/guests"));
const RsvpEditor = React.lazy(() => import("./routes/event/rsvp"));
const Timeline = React.lazy(() => import("./routes/event/timeline"));
const Sharing = React.lazy(() => import("./routes/event/sharing"));
const Analytics = React.lazy(() => import("./routes/event/analytics"));
const Settings = React.lazy(() => import("./routes/event/settings"));

// ─── Lazy imports: default (non-rusty) guest pages ───────────────────────────
const GuestCover = React.lazy(() => import("./routes/guest/cover"));
const GuestLogin = React.lazy(() => import("./routes/guest/guest-login"));
const GuestHome = React.lazy(() => import("./routes/guest/home"));
const GuestRsvp = React.lazy(() => import("./routes/guest/rsvp"));
const GuestInfo = React.lazy(() => import("./routes/rusty/rusty-info"));
const GuestMessage = React.lazy(() => import("./routes/rusty/rusty-message"));
const GuestWishes = React.lazy(() => import("./routes/guest/wishes"));
const GuestContact = React.lazy(() => import("./routes/guest/contact"));

// ─── Lazy imports: rusty guest pages ─────────────────────────────────────────
const RustyCover = React.lazy(() => import("./routes/rusty/rusty-cover"));
const RustyLogin = React.lazy(() => import("./routes/rusty/rusty-login"));
const RustyHome = React.lazy(() => import("./routes/rusty/rusty-home"));
const RustyRsvp = React.lazy(() => import("./routes/rusty/rusty-rsvp"));
const RustyInfo = React.lazy(() => import("./routes/rusty/rusty-info"));
const RustyMessage = React.lazy(() => import("./routes/rusty/rusty-message"));

// ─── QueryClient ────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

// ─── Loading spinner ─────────────────────────────────────────────────────────
function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
    </div>
  );
}

// ─── EventNotFound ──────────────────────────────────────────────────────────
function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">Event Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">
          The event you're looking for doesn't exist or may have been removed.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Go to homepage
        </a>
      </div>
    </div>
  );
}

// ─── ProtectedRoute ─────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        navigate("/login", { replace: true });
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) return <FullScreenSpinner />;
  if (!authenticated) return null;
  return <>{children}</>;
}

// ─── Account page (inline) ──────────────────────────────────────────────────
function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Account</h1>
        <p className="text-sm text-slate-500 mb-6">Manage your account settings</p>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm text-slate-900">{email ?? "Loading…"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign out
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SLUG RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

async function resolveSlugToEvent(
  slug: string,
): Promise<{ event: UserEvent | null; notFound: boolean }> {
  // 1. Try user_events.slug
  const { data: direct, error: err1 } = await supabase
    .from("user_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (err1) throw err1;
  if (direct) return { event: direct as UserEvent, notFound: false };

  // 2. Try event_slug_redirects
  const { data: redirect, error: err2 } = await supabase
    .from("event_slug_redirects")
    .select("event_id")
    .eq("slug", slug)
    .maybeSingle();

  if (err2) throw err2;
  if (redirect) {
    const { data: byId, error: err3 } = await supabase
      .from("user_events")
      .select("*")
      .eq("id", redirect.event_id)
      .maybeSingle();
    if (err3) throw err3;
    if (byId) return { event: byId as UserEvent, notFound: false };
  }

  return { event: null, notFound: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT FETCH HOOK (shared by UUID-based template routers)
// ═══════════════════════════════════════════════════════════════════════════

function usePublicEvent(eventId: string | undefined) {
  return useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
    enabled: !!eventId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE-AWARE ROUTER COMPONENTS (UUID-based: /:eventId)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renders the cover page based on the event's template_id.
 * Used for UUID routes: /:eventId
 */
function TemplateCoverRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = usePublicEvent(eventId);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  if (event.template_id === "rusty") {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <RustyCover />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <GuestCover />
    </Suspense>
  );
}

/**
 * Renders the login page based on the event's template_id.
 * Used for UUID routes: /:eventId/login
 */
function TemplateLoginRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = usePublicEvent(eventId);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  if (event.template_id === "rusty") {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <RustyLogin />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <GuestLogin />
    </Suspense>
  );
}

/**
 * Renders the home layout based on the event's template_id, with nested
 * child routes (rsvp, info, message, wishes, contact).
 * Used for UUID routes: /:eventId/home
 */
function TemplateHomeRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = usePublicEvent(eventId);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  if (event.template_id === "rusty") {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <Routes>
          <Route element={<RustyLayout lang="en" />}>
            <Route index element={<RustyHome />} />
            <Route path="rsvp" element={<RustyRsvp />} />
            <Route path="info" element={<RustyInfo />} />
            <Route path="message" element={<RustyMessage />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route index element={<GuestHome />} />
          <Route path="rsvp" element={<GuestRsvp />} />
          <Route path="info" element={<GuestInfo />} />
          <Route path="message" element={<GuestMessage />} />
          <Route path="wishes" element={<GuestWishes />} />
          <Route path="contact" element={<GuestContact />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SLUG-BASED ROUTER COMPONENTS (/e/:slug)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolves a slug to an event, pre-populates the react-query cache, then
 * renders nested <Routes> using a synthetic location that replaces
 * /e/:slug with /${event.id} so the UUID-based components work unchanged.
 */
function SlugRouter({ children }: { children: (eventId: string) => React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const qc = useQueryClient();

  const { data: resolved, isLoading, error } = useQuery({
    queryKey: ["slug-resolve", slug],
    queryFn: () => resolveSlugToEvent(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <FullScreenSpinner />;
  if (error) return <EventNotFound />;
  if (resolved?.notFound || !resolved?.event) return <EventNotFound />;

  const event = resolved.event;

  // Pre-populate the cache so UUID-based child components find the event
  // without an extra fetch.
  qc.setQueryData(["public-event", event.id], event);

  // Build a synthetic location that swaps /e/:slug → /${event.id}
  const slugPrefix = `/e/${slug}`;
  const syntheticPathname =
    location.pathname === slugPrefix
      ? `/${event.id}`
      : `/${event.id}${location.pathname.slice(slugPrefix.length)}`;

  const syntheticLocation = { ...location, pathname: syntheticPathname };

  return (
    <Routes location={syntheticLocation}>
      {children(event.id)}
    </Routes>
  );
}

/**
 * SlugCoverRouter — resolves slug, renders template-appropriate cover.
 * Route: /e/:slug
 */
function SlugCoverRouter() {
  return (
    <SlugRouter>
      {(eventId) => (
        <>
          <Route path={`/${eventId}`} element={<TemplateCoverRouter />} />
          <Route path="*" element={<Navigate to={`/${eventId}`} replace />} />
        </>
      )}
    </SlugRouter>
  );
}

/**
 * SlugLoginRouter — resolves slug, renders template-appropriate login.
 * Route: /e/:slug/login
 */
function SlugLoginRouter() {
  return (
    <SlugRouter>
      {(eventId) => (
        <>
          <Route path={`/${eventId}/login`} element={<TemplateLoginRouter />} />
          <Route path="*" element={<Navigate to={`/${eventId}/login`} replace />} />
        </>
      )}
    </SlugRouter>
  );
}

/**
 * SlugHomeRouter — resolves slug, renders template-appropriate home with
 * nested child routes (rsvp, info, message, wishes, contact).
 * Route: /e/:slug/home
 */
function SlugHomeRouter() {
  return (
    <SlugRouter>
      {(eventId) => (
        <>
          <Route path={`/${eventId}/home`} element={<TemplateHomeRouter />} />
          <Route path={`/${eventId}/home/*`} element={<TemplateHomeRouter />} />
          <Route path="*" element={<Navigate to={`/${eventId}/home`} replace />} />
        </>
      )}
    </SlugRouter>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Routes>
        {/* Top-level pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Event editor (eager EventLayout with nested lazy sub-routes) */}
        <Route path="/event/:eventId" element={<EventLayout />}>
          <Route index element={<Navigate to="cover" replace />} />
          <Route path="cover" element={<CoverEditor />} />
          <Route path="login" element={<LoginEditor />} />
          <Route path="home" element={<HomeEditor />} />
          <Route path="theme" element={<ThemeEditor />} />
          <Route path="branding" element={<Branding />} />
          <Route path="guests" element={<Guests />} />
          <Route path="rsvp" element={<RsvpEditor />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="sharing" element={<Sharing />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Slug-based guest routes */}
        <Route path="/e/:slug" element={<SlugCoverRouter />} />
        <Route path="/e/:slug/login" element={<SlugLoginRouter />} />
        <Route path="/e/:slug/home/*" element={<SlugHomeRouter />} />

        {/* UUID-based guest routes */}
        <Route path="/:eventId" element={<TemplateCoverRouter />} />
        <Route path="/:eventId/login" element={<TemplateLoginRouter />} />
        <Route path="/:eventId/home/*" element={<TemplateHomeRouter />} />

        {/* Fallback — never redirect deep event links to homepage; only
            unmatched top-level paths fall through to "/". */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GuestAuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GuestAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
