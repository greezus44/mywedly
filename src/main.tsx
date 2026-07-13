import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase, UserEvent } from "./lib/supabase";
import { GuestAuthProvider } from "./lib/guest-auth";

/* ──────────────────────────────────────────────────────────────
   Eager imports (layouts)
   ────────────────────────────────────────────────────────────── */
import EventLayout from "./routes/event/event-layout";
import GuestLayout from "./routes/guest/guest-layout";
import RustyLayout from "./routes/rusty/rusty-layout";

/* ──────────────────────────────────────────────────────────────
   Lazy imports (page components)
   ────────────────────────────────────────────────────────────── */
const Landing = React.lazy(() => import("./routes/landing"));
const Auth = React.lazy(() => import("./routes/auth"));
const Dashboard = React.lazy(() => import("./routes/dashboard"));

// Account page – no separate file exists, so we define a minimal
// inline component here.
function Account() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Account</h1>
        <p className="text-sm text-gray-500">Account settings coming soon.</p>
      </div>
    </div>
  );
}

// Event editor routes
const CoverEditor = React.lazy(() => import("./routes/event/cover-editor"));
const LoginEditor = React.lazy(() => import("./routes/event/login-editor"));
const HomeEditor = React.lazy(() => import("./routes/event/home-editor"));
const ThemeEditor = React.lazy(() => import("./routes/event/theme-editor"));
const Branding = React.lazy(() => import("./routes/event/branding"));
const Guests = React.lazy(() => import("./routes/event/guests"));
const RsvpManager = React.lazy(() => import("./routes/event/rsvp"));
const Timeline = React.lazy(() => import("./routes/event/timeline"));
const Sharing = React.lazy(() => import("./routes/event/sharing"));
const Analytics = React.lazy(() => import("./routes/event/analytics"));
const Settings = React.lazy(() => import("./routes/event/settings"));

// Guest-facing cover & login (default template)
const Cover = React.lazy(() => import("./routes/guest/cover"));
const GuestLogin = React.lazy(() => import("./routes/guest/guest-login"));

// Guest-facing child pages (default template)
const Home = React.lazy(() => import("./routes/guest/home"));
const Rsvp = React.lazy(() => import("./routes/guest/rsvp"));
const Wishes = React.lazy(() => import("./routes/guest/wishes"));
const Contact = React.lazy(() => import("./routes/guest/contact"));

// Rusty template components
const RustyCover = React.lazy(() => import("./routes/rusty/rusty-cover"));
const RustyLogin = React.lazy(() => import("./routes/rusty/rusty-login"));
const RustyHome = React.lazy(() => import("./routes/rusty/rusty-home"));
const RustyRsvp = React.lazy(() => import("./routes/rusty/rusty-rsvp"));
const RustyInfo = React.lazy(() => import("./routes/rusty/rusty-info"));
const RustyMessage = React.lazy(() => import("./routes/rusty/rusty-message"));

/* ──────────────────────────────────────────────────────────────
   QueryClient
   ────────────────────────────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

/* ──────────────────────────────────────────────────────────────
   normalizeEvent – ensures all config sub-objects exist
   ────────────────────────────────────────────────────────────── */
function normalizeEvent(data: any): UserEvent {
  return {
    ...data,
    cover_config: data.cover_config || {},
    login_config: data.login_config || {},
    theme: data.theme || {},
    logo_config: data.logo_config || {},
    content: data.content || {},
    sharing_config: data.sharing_config || {},
    draft_cover_config: data.draft_cover_config || data.cover_config || {},
    draft_login_config: data.draft_login_config || data.login_config || {},
    draft_theme: data.draft_theme || data.theme || {},
    draft_logo_config: data.draft_logo_config || data.logo_config || {},
    draft_content: data.draft_content || data.content || {},
    draft_sharing_config: data.draft_sharing_config || data.sharing_config || {},
  };
}

/* ──────────────────────────────────────────────────────────────
   Shared loading / error components
   ────────────────────────────────────────────────────────────── */
function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
}

function EventNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6">
      <h1 className="text-2xl font-bold text-gray-900">Event Not Found</h1>
      <p className="text-sm text-gray-500">
        The event you're looking for doesn't exist or may have been removed.
      </p>
      <a href="/" className="text-sm text-gray-700 underline hover:text-gray-900">
        Go to homepage
      </a>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   ProtectedRoute – checks auth, redirects to /login if not
   authenticated.
   ────────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "authed" | "unauthed">(
    "loading"
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setState(user ? "authed" : "unauthed");
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") return <FullScreenSpinner />;
  if (state === "unauthed") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ──────────────────────────────────────────────────────────────
   useResolveSlug – resolves a slug to a UserEvent.

   1. Query user_events where slug = $slug.
   2. If not found, query event_slug_redirects where slug = $slug
      to get the event_id, then fetch the event by id.
   3. If still not found, returns null.
   ────────────────────────────────────────────────────────────── */
function useResolveSlug(slug: string | undefined) {
  return useQuery<UserEvent | null>({
    queryKey: ["slug-event", slug],
    queryFn: async () => {
      if (!slug) return null;

      // 1. Try user_events by slug
      const { data: bySlug, error: err1 } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (err1) throw err1;
      if (bySlug) return normalizeEvent(bySlug);

      // 2. Try event_slug_redirects for old slugs
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
        if (byId) return normalizeEvent(byId);
      }

      // 3. Not found
      return null;
    },
    enabled: !!slug,
    staleTime: 60000,
  });
}

/* ──────────────────────────────────────────────────────────────
   useFetchEvent – fetches a single event by UUID eventId.
   Used by the TemplateCoverRouter / TemplateLoginRouter /
   TemplateHomeRouter to determine template_id.
   ────────────────────────────────────────────────────────────── */
function useFetchEvent(eventId: string | undefined) {
  return useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeEvent(data) : null;
    },
    enabled: !!eventId,
    staleTime: 30000,
  });
}

/* ──────────────────────────────────────────────────────────────
   TemplateCoverRouter – renders cover based on template_id.
   Used for UUID route  /:eventId
   ────────────────────────────────────────────────────────────── */
function TemplateCoverRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useFetchEvent(eventId);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  if (event.template_id === "rusty") return <RustyCover />;
  return <Cover />;
}

/* ──────────────────────────────────────────────────────────────
   TemplateLoginRouter – renders login based on template_id.
   Used for UUID route  /:eventId/login
   ────────────────────────────────────────────────────────────── */
function TemplateLoginRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useFetchEvent(eventId);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  if (event.template_id === "rusty") return <RustyLogin />;
  return <GuestLogin />;
}

/* ──────────────────────────────────────────────────────────────
   TemplateHomeRouter – renders the guest layout based on
   template_id.  The layout provides the event via Outlet
   context and the nested child routes render inside it.

   Used for UUID routes:
     /:eventId/home        (index)
     /:eventId/home/rsvp
     /:eventId/home/info
     /:eventId/home/message
     /:eventId/home/wishes
     /:eventId/home/contact
   ────────────────────────────────────────────────────────────── */
function TemplateHomeRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useFetchEvent(eventId);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  if (event.template_id === "rusty") return <RustyLayout lang="en" />;
  return <GuestLayout />;
}

/* ──────────────────────────────────────────────────────────────
   TemplateChildRouter – takes the resolved event (from outlet
   context provided by the layout) and renders the appropriate
   child component based on template_id and the current route.

   Works for BOTH:
     /e/:slug/home/:child
     /:eventId/home/:child
   because the slug routers render the UUID-based routes with a
   synthetic location (see below), so eventId is always in params.
   ────────────────────────────────────────────────────────────── */
function TemplateChildRouter() {
  const { child } = useParams<{ child: string }>();
  const ctx = useOutletContext<{ event: UserEvent; lang?: "en" | "bm" }>();
  const event = ctx?.event;

  if (!event) return <EventNotFound />;

  const isRusty = event.template_id === "rusty";

  switch (child) {
    case "rsvp":
      return isRusty ? <RustyRsvp /> : <Rsvp />;
    case "wishes":
      return isRusty ? <RustyMessage /> : <Wishes />;
    case "contact":
      return isRusty ? <RustyInfo /> : <Contact />;
    case "info":
      return isRusty ? <RustyInfo /> : <Home />;
    case "message":
      return isRusty ? <RustyMessage /> : <Wishes />;
    default:
      return <EventNotFound />;
  }
}

/* ──────────────────────────────────────────────────────────────
   HomeIndex – renders the home page content for the home index
   route (/:eventId/home with no child path).
   ────────────────────────────────────────────────────────────── */
function HomeIndex() {
  const ctx = useOutletContext<{ event: UserEvent; lang?: "en" | "bm" }>();
  const event = ctx?.event;

  if (!event) return <EventNotFound />;

  if (event.template_id === "rusty") return <RustyHome />;
  return <Home />;
}

/* ──────────────────────────────────────────────────────────────
   Slug routers – resolve the slug, pre-populate the react-query
   cache, then render the UUID-based routes against a synthetic
   location so that all existing components (which rely on
   useParams eventId) work unchanged.

   The browser URL stays as /e/:slug/...  – the synthetic location
   only affects route matching inside the nested <Routes>.
   ────────────────────────────────────────────────────────────── */

function SlugCoverRouter() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { data: event, isLoading, error } = useResolveSlug(slug);

  useEffect(() => {
    if (event) {
      qc.setQueryData(["public-event", event.id], event);
    }
  }, [event, qc]);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  const syntheticLocation = {
    pathname: `/${event.id}`,
    search: "",
    hash: "",
    state: null,
    key: "slug-cover",
  };

  return (
    <Routes location={syntheticLocation}>
      <Route path="/:eventId" element={<TemplateCoverRouter />} />
    </Routes>
  );
}

function SlugLoginRouter() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { data: event, isLoading, error } = useResolveSlug(slug);

  useEffect(() => {
    if (event) {
      qc.setQueryData(["public-event", event.id], event);
    }
  }, [event, qc]);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  const syntheticLocation = {
    pathname: `/${event.id}/login`,
    search: "",
    hash: "",
    state: null,
    key: "slug-login",
  };

  return (
    <Routes location={syntheticLocation}>
      <Route path="/:eventId/login" element={<TemplateLoginRouter />} />
    </Routes>
  );
}

function SlugHomeRouter() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const qc = useQueryClient();
  const { data: event, isLoading, error } = useResolveSlug(slug);

  useEffect(() => {
    if (event) {
      qc.setQueryData(["public-event", event.id], event);
    }
  }, [event, qc]);

  if (isLoading) return <FullScreenSpinner />;
  if (error || !event) return <EventNotFound />;

  // Extract suffix after /e/:slug/home
  const slugPrefix = location.pathname.match(/^\/e\/[^/]+\/home/);
  const suffix = slugPrefix
    ? location.pathname.slice(slugPrefix[0].length)
    : "";
  // suffix is "" for index, "/rsvp" for rsvp, etc.
  // Synthetic path: /:eventId/home + suffix
  const syntheticPath = `/${event.id}/home${suffix}`;

  const syntheticLocation = {
    ...location,
    pathname: syntheticPath,
  };

  return (
    <Routes location={syntheticLocation}>
      <Route path="/:eventId/home" element={<TemplateHomeRouter />}>
        <Route index element={<HomeIndex />} />
        <Route path="rsvp" element={<TemplateChildRouter />} />
        <Route path="info" element={<TemplateChildRouter />} />
        <Route path="message" element={<TemplateChildRouter />} />
        <Route path="wishes" element={<TemplateChildRouter />} />
        <Route path="contact" element={<TemplateChildRouter />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
}

/* ──────────────────────────────────────────────────────────────
   Suspense wrapper for lazy-loaded routes
   ────────────────────────────────────────────────────────────── */
function LazyFallback() {
  return <FullScreenSpinner />;
}

/* ──────────────────────────────────────────────────────────────
   App routes
   ────────────────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <React.Suspense fallback={<LazyFallback />}>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login" element={<Auth />} />

        {/* Protected routes */}
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
              <Account />
            </ProtectedRoute>
          }
        />

        {/* Event editor (dashboard side) */}
        <Route path="/event/:eventId" element={<EventLayout />}>
          <Route index element={<Navigate to="cover" replace />} />
          <Route path="cover" element={<CoverEditor />} />
          <Route path="login" element={<LoginEditor />} />
          <Route path="home" element={<HomeEditor />} />
          <Route path="theme" element={<ThemeEditor />} />
          <Route path="branding" element={<Branding />} />
          <Route path="guests" element={<Guests />} />
          <Route path="rsvp" element={<RsvpManager />} />
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
        <Route path="/:eventId/home" element={<TemplateHomeRouter />}>
          <Route index element={<HomeIndex />} />
          <Route path="rsvp" element={<TemplateChildRouter />} />
          <Route path="info" element={<TemplateChildRouter />} />
          <Route path="message" element={<TemplateChildRouter />} />
          <Route path="wishes" element={<TemplateChildRouter />} />
          <Route path="contact" element={<TemplateChildRouter />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

/* ──────────────────────────────────────────────────────────────
   Root
   ────────────────────────────────────────────────────────────── */
const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GuestAuthProvider>
          <AppRoutes />
        </GuestAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
