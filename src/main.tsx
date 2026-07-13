import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import { supabase, type UserEvent } from "./lib/supabase";
import EventLayout from "./routes/event/event-layout";
import GuestLayout from "./routes/guest/guest-layout";
import { RustyLayout } from "./routes/rusty/rusty-layout";

const Landing = lazy(() => import("./routes/landing"));
const Auth = lazy(() => import("./routes/auth"));
const Dashboard = lazy(() => import("./routes/dashboard"));

const CoverEditor = lazy(() => import("./routes/event/cover-editor"));
const LoginEditor = lazy(() => import("./routes/event/login-editor"));
const HomeEditor = lazy(() => import("./routes/event/home-editor"));
const ThemeEditor = lazy(() => import("./routes/event/theme-editor"));
const Branding = lazy(() => import("./routes/event/branding"));
const Guests = lazy(() => import("./routes/event/guests"));
const RsvpEditor = lazy(() => import("./routes/event/rsvp"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );
}

function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Event Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">The event you are looking for does not exist or has been removed.</p>
        <a href="/" className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
          Go to home
        </a>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        setAllowed(true);
      } else {
        navigate("/login", { replace: true });
      }
      setChecking(false);
    });
    return () => { mounted = false; };
  }, [navigate]);

  if (checking) return <LoadingSpinner />;
  if (!allowed) return null;
  return <>{children}</>;
}

function AccountPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Account</h1>
        <p className="text-sm text-slate-600 mb-1">Signed in as</p>
        <p className="text-sm font-medium text-slate-900 mb-6">{user?.email || "Unknown"}</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate("/dashboard")} className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
            Go to dashboard
          </button>
          <button onClick={handleSignOut} className="w-full px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-200 border border-slate-200">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function useSlugResolve(slug: string | undefined) {
  return useQuery<UserEvent | null>({
    queryKey: ["slug-resolve", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as UserEvent;
      const { data: redirect, error: redErr } = await supabase
        .from("event_slug_redirects")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (redErr) throw redErr;
      if (!redirect) return null;
      const { data: evt, error: evtErr } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", redirect.event_id)
        .maybeSingle();
      if (evtErr) throw evtErr;
      return (evt as UserEvent) || null;
    },
    enabled: !!slug,
  });
}

function useEventById(eventId: string | undefined) {
  return useQuery<UserEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return (data as UserEvent) || null;
    },
    enabled: !!eventId,
  });
}

function SlugCoverRouter() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useSlugResolve(slug);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  queryClient.setQueryData(["public-event", event.id], event);
  const Cover = event.template_id === "rusty" ? RustyCover : GuestCover;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Cover />
    </Suspense>
  );
}

function SlugLoginRouter() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useSlugResolve(slug);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  queryClient.setQueryData(["public-event", event.id], event);
  const Login = event.template_id === "rusty" ? RustyLogin : GuestLogin;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Login />
    </Suspense>
  );
}

function SlugHomeRouter() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useSlugResolve(slug);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  queryClient.setQueryData(["public-event", event.id], event);

  const syntheticLocation = {
    ...location,
    pathname: location.pathname.replace(`/e/${slug}`, `/${event.id}`),
  };

  return (
    <SyntheticRouter syntheticLocation={syntheticLocation} eventId={event.id} templateId={event.template_id} />
  );
}

function SyntheticRouter({ syntheticLocation, eventId, templateId }: { syntheticLocation: ReturnType<typeof useLocation>; eventId: string; templateId: string }) {
  const path = syntheticLocation.pathname;
  const base = `/${eventId}`;
  const rest = path.startsWith(base) ? path.slice(base.length) : "/";
  const child = rest === "" || rest === "/" ? "home" : rest.replace(/^\//, "").split("/")[0];

  const isRusty = templateId === "rusty";
  let element: ReactNode;
  if (isRusty) {
    switch (child) {
      case "rsvp": element = <RustyRsvp />; break;
      case "info": element = <RustyInfo />; break;
      case "message": element = <RustyMessage />; break;
      case "wishes": element = <GuestWishes />; break;
      case "contact": element = <GuestContact />; break;
      default: element = <RustyHome />;
    }
  } else {
    switch (child) {
      case "rsvp": element = <GuestRsvp />; break;
      case "info": element = <GuestHome />; break;
      case "message": case "contact": element = <GuestContact />; break;
      case "wishes": element = <GuestWishes />; break;
      default: element = <GuestHome />;
    }
  }

  const Layout = isRusty ? RustyLayout : GuestLayout;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Layout>{element}</Layout>
    </Suspense>
  );
}

function TemplateCoverRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useEventById(eventId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  queryClient.setQueryData(["public-event", event.id], event);
  const Cover = event.template_id === "rusty" ? RustyCover : GuestCover;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Cover />
    </Suspense>
  );
}

function TemplateLoginRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useEventById(eventId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  queryClient.setQueryData(["public-event", event.id], event);
  const Login = event.template_id === "rusty" ? RustyLogin : GuestLogin;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Login />
    </Suspense>
  );
}

function TemplateHomeRouter() {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useEventById(eventId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !event) return <EventNotFound />;

  queryClient.setQueryData(["public-event", event.id], event);

  const base = `/${eventId}`;
  const rest = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : "/";
  const child = rest === "" || rest === "/" ? "home" : rest.replace(/^\//, "").split("/")[0];

  const isRusty = event.template_id === "rusty";
  let element: ReactNode;
  if (isRusty) {
    switch (child) {
      case "rsvp": element = <RustyRsvp />; break;
      case "info": element = <RustyInfo />; break;
      case "message": element = <RustyMessage />; break;
      case "wishes": element = <GuestWishes />; break;
      case "contact": element = <GuestContact />; break;
      default: element = <RustyHome />;
    }
  } else {
    switch (child) {
      case "rsvp": element = <GuestRsvp />; break;
      case "info": element = <GuestHome />; break;
      case "message": case "contact": element = <GuestContact />; break;
      case "wishes": element = <GuestWishes />; break;
      default: element = <GuestHome />;
    }
  }

  const Layout = isRusty ? RustyLayout : GuestLayout;
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Layout>{element}</Layout>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Suspense fallback={<LoadingSpinner />}><Landing /></Suspense>} />
              <Route path="/login" element={<Suspense fallback={<LoadingSpinner />}><Auth /></Suspense>} />
              <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

              <Route path="/event/:eventId" element={<EventLayout />}>
                <Route index element={<Navigate to="cover" replace />} />
                <Route path="cover" element={<Suspense fallback={<LoadingSpinner />}><CoverEditor /></Suspense>} />
                <Route path="login" element={<Suspense fallback={<LoadingSpinner />}><LoginEditor /></Suspense>} />
                <Route path="home" element={<Suspense fallback={<LoadingSpinner />}><HomeEditor /></Suspense>} />
                <Route path="theme" element={<Suspense fallback={<LoadingSpinner />}><ThemeEditor /></Suspense>} />
                <Route path="branding" element={<Suspense fallback={<LoadingSpinner />}><Branding /></Suspense>} />
                <Route path="guests" element={<Suspense fallback={<LoadingSpinner />}><Guests /></Suspense>} />
                <Route path="rsvp" element={<Suspense fallback={<LoadingSpinner />}><RsvpEditor /></Suspense>} />
                <Route path="timeline" element={<Suspense fallback={<LoadingSpinner />}><Timeline /></Suspense>} />
                <Route path="sharing" element={<Suspense fallback={<LoadingSpinner />}><Sharing /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<LoadingSpinner />}><Settings /></Suspense>} />
              </Route>

              <Route path="/e/:slug" element={<SlugCoverRouter />} />
              <Route path="/e/:slug/login" element={<SlugLoginRouter />} />
              <Route path="/e/:slug/home" element={<SlugHomeRouter />} />
              <Route path="/e/:slug/home/*" element={<SlugHomeRouter />} />

              <Route path="/:eventId" element={<TemplateCoverRouter />} />
              <Route path="/:eventId/login" element={<TemplateLoginRouter />} />
              <Route path="/:eventId/home" element={<TemplateHomeRouter />} />
              <Route path="/:eventId/home/*" element={<TemplateHomeRouter />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </GuestAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
