import "./index.css";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type SlugRedirect } from "./lib/supabase";

// Lazy-loaded pages
const LandingPage = React.lazy(() => import("./routes/landing"));
const AuthPage = React.lazy(() => import("./routes/auth"));
const DashboardPage = React.lazy(() => import("./routes/dashboard"));
const EventLayoutPage = React.lazy(() => import("./routes/event/event-layout"));

// Dashboard child pages (lazy)
const CoverPage = React.lazy(() => import("./routes/event/cover-editor"));
const LoginPage = React.lazy(() => import("./routes/event/login-editor"));
const HomePage = React.lazy(() => import("./routes/event/home-editor"));
const ThemePage = React.lazy(() => import("./routes/event/theme-editor"));
const EventsPage = React.lazy(() => import("./routes/event/events"));
const GuestsPage = React.lazy(() => import("./routes/event/guests"));
const GroupsPage = React.lazy(() => import("./routes/event/groups"));
const RsvpPage = React.lazy(() => import("./routes/event/rsvp"));
const TimelinePage = React.lazy(() => import("./routes/event/timeline"));
const SharingPage = React.lazy(() => import("./routes/event/sharing"));
const AnalyticsPage = React.lazy(() => import("./routes/event/analytics"));
const SettingsPage = React.lazy(() => import("./routes/event/settings"));

// Default guest pages (lazy)
const GuestLayout = React.lazy(() => import("./routes/guest/guest-layout"));
const GuestCover = React.lazy(() => import("./routes/guest/cover"));
const GuestLogin = React.lazy(() => import("./routes/guest/guest-login"));
const GuestHome = React.lazy(() => import("./routes/guest/home"));
const GuestRsvp = React.lazy(() => import("./routes/guest/rsvp"));
const GuestWishes = React.lazy(() => import("./routes/guest/wishes"));
const GuestContact = React.lazy(() => import("./routes/guest/contact"));

// Rusty guest pages (lazy)
const RustyLayout = React.lazy(() => import("./routes/rusty/rusty-layout"));
const RustyCover = React.lazy(() => import("./routes/rusty/rusty-cover"));
const RustyLogin = React.lazy(() => import("./routes/rusty/rusty-login"));
const RustyHome = React.lazy(() => import("./routes/rusty/rusty-home"));
const RustyRsvp = React.lazy(() => import("./routes/rusty/rusty-rsvp"));
const RustyWishes = React.lazy(() => import("./routes/rusty/rusty-wishes"));
const RustyContact = React.lazy(() => import("./routes/rusty/rusty-contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, refetchOnWindowFocus: false },
  },
});

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-200 border-t-black animate-spin rounded-full" />
  </div>
);

/**
 * TemplateRouter — fetches the event by slug and renders either the rusty
 * template (if event.template_id === "rusty") or the default guest template.
 * Defined inline per the routing spec.
 */
function TemplateRouter() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["template-router", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: direct, error: directErr } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (directErr) throw directErr;
      if (direct) return direct as UserEvent;
      const { data: redirect, error: redirErr } = await supabase
        .from("event_slug_redirects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (redirErr) throw redirErr;
      if (redirect) {
        const r = redirect as SlugRedirect;
        const { data: redirected, error: rErr } = await supabase
          .from("user_events")
          .select("*")
          .eq("id", r.event_id)
          .eq("is_published", true)
          .maybeSingle();
        if (rErr) throw rErr;
        return (redirected as UserEvent) || null;
      }
      return null;
    },
    enabled: !!slug,
  });

  if (isLoading) return <Spinner />;
  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl mb-3 text-gray-900">Event not found</h1>
          <p className="text-sm text-gray-500">The event you're looking for doesn't exist or is no longer published.</p>
        </div>
      </div>
    );
  }

  const isRusty = event.template_id === "rusty";

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
          <Route path="*" element={<Navigate to="cover" replace />} />
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
        <Route path="*" element={<Navigate to="cover" replace />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/event/:eventId" element={<EventLayoutPage />}>
                  <Route index element={<Navigate to="cover" replace />} />
                  <Route path="cover" element={<CoverPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="home" element={<HomePage />} />
                  <Route path="theme" element={<ThemePage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="guests" element={<GuestsPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="rsvp" element={<RsvpPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="sharing" element={<SharingPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="/e/:slug" element={<TemplateRouter />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </GuestAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
