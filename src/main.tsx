import "./index.css";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "./lib/supabase";
import { GuestAuthProvider } from "./lib/guest-auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

const Landing = lazy(() => import("./routes/landing"));
const Auth = lazy(() => import("./routes/auth"));
const Dashboard = lazy(() => import("./routes/dashboard"));

const EventLayout = lazy(() => import("./routes/event/event-layout"));
const GuestLayout = lazy(() => import("./routes/guest/guest-layout"));
const RustyLayout = lazy(() => import("./routes/rusty/rusty-layout"));

const CoverEditor = lazy(() => import("./routes/event/cover-editor"));
const LoginEditor = lazy(() => import("./routes/event/login-editor"));
const HomeEditor = lazy(() => import("./routes/event/home-editor"));
const ThemeEditor = lazy(() => import("./routes/event/theme-editor"));
const Branding = lazy(() => import("./routes/event/branding"));
const Guests = lazy(() => import("./routes/event/guests"));
const EventRsvpEditor = lazy(() => import("./routes/event/rsvp"));
const Timeline = lazy(() => import("./routes/event/timeline"));
const Sharing = lazy(() => import("./routes/event/sharing"));
const Analytics = lazy(() => import("./routes/event/analytics"));
const Settings = lazy(() => import("./routes/event/settings"));

const GuestCover = lazy(() => import("./routes/guest/cover"));
const GuestLogin = lazy(() => import("./routes/guest/guest-login"));
const GuestHome = lazy(() => import("./routes/guest/home"));
const GuestRsvp = lazy(() => import("./routes/guest/rsvp"));
const GuestWishes = lazy(() => import("./routes/guest/wishes"));
const GuestContact = lazy(() => import("./routes/guest/contact"));

const RustyCover = lazy(() => import("./routes/rusty/rusty-cover"));
const RustyLogin = lazy(() => import("./routes/rusty/rusty-login"));
const RustyHome = lazy(() => import("./routes/rusty/rusty-home"));
const RustyRsvp = lazy(() => import("./routes/rusty/rusty-rsvp"));
const RustyInfo = lazy(() => import("./routes/rusty/rusty-info"));
const RustyMessage = lazy(() => import("./routes/rusty/rusty-message"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  );
}

function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Event Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">The event you are looking for does not exist or has been removed.</p>
        <a href="/" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          Go Home
        </a>
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        setAllowed(true);
      } else {
        navigate("/login", { replace: true });
      }
      setChecking(false);
    });
    return () => { active = false; };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return allowed ? <Outlet /> : null;
}

function AccountPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) setEmail(user.email || "");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Eventful</span>
          <button onClick={handleSignOut} className="text-sm text-slate-600 hover:text-slate-900">Sign out</button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Account</h1>
          <p className="text-sm text-slate-500 mb-6">Signed in as</p>
          <p className="text-sm font-medium text-slate-900 mb-6">{email}</p>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}

function resolveSlug(slug: string): Promise<UserEvent | null> {
  return (async () => {
    const { data, error } = await supabase
      .from("user_events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as UserEvent;

    const { data: redirect } = await supabase
      .from("event_slug_redirects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!redirect) return null;

    const { data: redirected, error: redirectError } = await supabase
      .from("user_events")
      .select("*")
      .eq("id", redirect.event_id)
      .maybeSingle();
    if (redirectError) throw redirectError;
    return (redirected as UserEvent) || null;
  })();
}

function useSyntheticEvent(slug: string | undefined, enabled: boolean) {
  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event-slug", slug],
    enabled: enabled && !!slug,
    queryFn: () => resolveSlug(slug!),
  });
  const queryClient = useQueryClient();
  useEffect(() => {
    if (event) {
      queryClient.setQueryData(["public-event", event.id], event);
    }
  }, [event, queryClient]);
  return { event, isLoading, isError };
}

function SlugCoverRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading, isError } = useSyntheticEvent(slug, true);
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  const syntheticPathname = location.pathname.replace(`/e/${slug}`, `/${event.id}`);
  const syntheticLocation = { ...location, pathname: syntheticPathname };

  return (
    <Routes location={syntheticLocation}>
      <Route path={`/${event.id}`} element={<GuestCover />} />
      <Route path="*" element={<Navigate to={`/${event.id}`} replace />} />
    </Routes>
  );
}

function SlugLoginRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading, isError } = useSyntheticEvent(slug, true);
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  const syntheticPathname = location.pathname.replace(`/e/${slug}`, `/${event.id}`);
  const syntheticLocation = { ...location, pathname: syntheticPathname };

  return (
    <Routes location={syntheticLocation}>
      <Route path={`/${event.id}/login`} element={<GuestLogin />} />
      <Route path="*" element={<Navigate to={`/${event.id}/login`} replace />} />
    </Routes>
  );
}

function SlugHomeRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { event, isLoading, isError } = useSyntheticEvent(slug, true);
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  const syntheticPathname = location.pathname.replace(`/e/${slug}`, `/${event.id}`);
  const syntheticLocation = { ...location, pathname: syntheticPathname };

  return (
    <Routes location={syntheticLocation}>
      <Route path={`/${event.id}/home`} element={<GuestLayout />}>
        <Route index element={<GuestHome />} />
        <Route path="rsvp" element={<GuestRsvp />} />
        <Route path="info" element={<GuestHome />} />
        <Route path="message" element={<GuestWishes />} />
        <Route path="wishes" element={<GuestWishes />} />
        <Route path="contact" element={<GuestContact />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${event.id}/home`} replace />} />
    </Routes>
  );
}

function TemplateCoverRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  if (event.template_id === "rusty") {
    return <RustyCover />;
  }
  return <GuestCover />;
}

function TemplateLoginRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  if (event.template_id === "rusty") {
    return <RustyLogin />;
  }
  return <GuestLogin />;
}

function TemplateHomeRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as UserEvent | null;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  if (event.template_id === "rusty") {
    return (
      <Routes>
        <Route path={`/${eventId}/home`} element={<RustyLayout lang="en" setLang={() => {}} />}>
          <Route index element={<RustyHome />} />
          <Route path="rsvp" element={<RustyRsvp />} />
          <Route path="info" element={<RustyInfo />} />
          <Route path="message" element={<RustyMessage />} />
        </Route>
        <Route path="*" element={<Navigate to={`/${eventId}/home`} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path={`/${eventId}/home`} element={<GuestLayout />}>
        <Route index element={<GuestHome />} />
        <Route path="rsvp" element={<GuestRsvp />} />
        <Route path="wishes" element={<GuestWishes />} />
        <Route path="contact" element={<GuestContact />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${eventId}/home`} replace />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<LoadingSpinner />}><Landing /></Suspense>} />
      <Route path="/login" element={<Suspense fallback={<LoadingSpinner />}><Auth /></Suspense>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      <Route path="/event/:eventId" element={<Suspense fallback={<LoadingSpinner />}><EventLayout /></Suspense>}>
        <Route index element={<Navigate to="cover" replace />} />
        <Route path="cover" element={<Suspense fallback={<LoadingSpinner />}><CoverEditor /></Suspense>} />
        <Route path="login" element={<Suspense fallback={<LoadingSpinner />}><LoginEditor /></Suspense>} />
        <Route path="home" element={<Suspense fallback={<LoadingSpinner />}><HomeEditor /></Suspense>} />
        <Route path="theme" element={<Suspense fallback={<LoadingSpinner />}><ThemeEditor /></Suspense>} />
        <Route path="branding" element={<Suspense fallback={<LoadingSpinner />}><Branding /></Suspense>} />
        <Route path="guests" element={<Suspense fallback={<LoadingSpinner />}><Guests /></Suspense>} />
        <Route path="rsvp" element={<Suspense fallback={<LoadingSpinner />}><EventRsvpEditor /></Suspense>} />
        <Route path="timeline" element={<Suspense fallback={<LoadingSpinner />}><Timeline /></Suspense>} />
        <Route path="sharing" element={<Suspense fallback={<LoadingSpinner />}><Sharing /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<LoadingSpinner />}><Settings /></Suspense>} />
      </Route>

      <Route path="/e/:slug" element={<Suspense fallback={<LoadingSpinner />}><SlugCoverRouter /></Suspense>} />
      <Route path="/e/:slug/login" element={<Suspense fallback={<LoadingSpinner />}><SlugLoginRouter /></Suspense>} />
      <Route path="/e/:slug/home/*" element={<Suspense fallback={<LoadingSpinner />}><SlugHomeRouter /></Suspense>} />

      <Route path="/:eventId" element={<Suspense fallback={<LoadingSpinner />}><TemplateCoverRouter /></Suspense>} />
      <Route path="/:eventId/login" element={<Suspense fallback={<LoadingSpinner />}><TemplateLoginRouter /></Suspense>} />
      <Route path="/:eventId/home/*" element={<Suspense fallback={<LoadingSpinner />}><TemplateHomeRouter /></Suspense>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </GuestAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
