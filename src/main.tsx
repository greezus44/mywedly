import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { GuestAuthProvider } from "./lib/guest-auth";

// Eager layouts
import EventLayout from "./routes/event/event-layout";
import GuestLayout from "./routes/guest/guest-layout";

// Lazy pages
const Landing = React.lazy(() => import("./routes/landing"));
const Auth = React.lazy(() => import("./routes/auth"));
const Dashboard = React.lazy(() => import("./routes/dashboard"));
const Account = React.lazy(() => import("./routes/account"));

// Event admin pages (nested under EventLayout)
const CoverEditor = React.lazy(() => import("./routes/event/cover-editor"));
const LoginEditor = React.lazy(() => import("./routes/event/login-editor"));
const HomeEditor = React.lazy(() => import("./routes/event/home-editor"));
const ThemeEditor = React.lazy(() => import("./routes/event/theme-editor"));
const BrandingEditor = React.lazy(() => import("./routes/event/branding"));
const Guests = React.lazy(() => import("./routes/event/guests"));
const RsvpManagement = React.lazy(() => import("./routes/event/rsvp"));
const Timeline = React.lazy(() => import("./routes/event/timeline"));
const QrCodes = React.lazy(() => import("./routes/event/qr-codes"));
const Analytics = React.lazy(() => import("./routes/event/analytics"));
const Settings = React.lazy(() => import("./routes/event/settings"));
const Sharing = React.lazy(() => import("./routes/event/sharing"));

// Guest-facing pages
const Cover = React.lazy(() => import("./routes/guest/cover"));
const GuestLogin = React.lazy(() => import("./routes/guest/guest-login"));
const Home = React.lazy(() => import("./routes/guest/home"));
const Rsvp = React.lazy(() => import("./routes/guest/rsvp"));
const Wishes = React.lazy(() => import("./routes/guest/wishes"));
const Contact = React.lazy(() => import("./routes/guest/contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
}

async function requireAuth(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<
    "loading" | "authed" | "redirect"
  >("loading");

  React.useEffect(() => {
    let active = true;
    requireAuth().then((ok) => {
      if (!active) return;
      setState(ok ? "authed" : "redirect");
    });
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") return <Loading />;
  if (state === "redirect") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <React.Suspense fallback={<Loading />}>
            <Landing />
          </React.Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <React.Suspense fallback={<Loading />}>
            <Auth />
          </React.Suspense>
        }
      />

      {/* Protected admin routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<Loading />}>
              <Dashboard />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<Loading />}>
              <Account />
            </React.Suspense>
          </ProtectedRoute>
        }
      />

      {/* Event admin layout + nested routes */}
      <Route path="/event/:eventId" element={<EventLayout />}>
        <Route index element={<Navigate to="cover" replace />} />
        <Route
          path="cover"
          element={
            <React.Suspense fallback={<Loading />}>
              <CoverEditor />
            </React.Suspense>
          }
        />
        <Route
          path="login"
          element={
            <React.Suspense fallback={<Loading />}>
              <LoginEditor />
            </React.Suspense>
          }
        />
        <Route
          path="home"
          element={
            <React.Suspense fallback={<Loading />}>
              <HomeEditor />
            </React.Suspense>
          }
        />
        <Route
          path="theme"
          element={
            <React.Suspense fallback={<Loading />}>
              <ThemeEditor />
            </React.Suspense>
          }
        />
        <Route
          path="branding"
          element={
            <React.Suspense fallback={<Loading />}>
              <BrandingEditor />
            </React.Suspense>
          }
        />
        <Route
          path="guests"
          element={
            <React.Suspense fallback={<Loading />}>
              <Guests />
            </React.Suspense>
          }
        />
        <Route
          path="rsvp"
          element={
            <React.Suspense fallback={<Loading />}>
              <RsvpManagement />
            </React.Suspense>
          }
        />
        <Route
          path="timeline"
          element={
            <React.Suspense fallback={<Loading />}>
              <Timeline />
            </React.Suspense>
          }
        />
        <Route
          path="qr-codes"
          element={
            <React.Suspense fallback={<Loading />}>
              <QrCodes />
            </React.Suspense>
          }
        />
        <Route
          path="analytics"
          element={
            <React.Suspense fallback={<Loading />}>
              <Analytics />
            </React.Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <React.Suspense fallback={<Loading />}>
              <Settings />
            </React.Suspense>
          }
        />
        <Route
          path="sharing"
          element={
            <React.Suspense fallback={<Loading />}>
              <Sharing />
            </React.Suspense>
          }
        />
      </Route>

      {/* Guest-facing routes. /:eventId is safe here because /event/:eventId
          uses a literal "event" segment, so there's no routing conflict. */}
      <Route
        path="/:eventId"
        element={
          <React.Suspense fallback={<Loading />}>
            <Cover />
          </React.Suspense>
        }
      />
      <Route
        path="/:eventId/login"
        element={
          <React.Suspense fallback={<Loading />}>
            <GuestLogin />
          </React.Suspense>
        }
      />
      <Route path="/:eventId/home" element={<GuestLayout />}>
        <Route
          index
          element={
            <React.Suspense fallback={<Loading />}>
              <Home />
            </React.Suspense>
          }
        />
        <Route
          path="rsvp"
          element={
            <React.Suspense fallback={<Loading />}>
              <Rsvp />
            </React.Suspense>
          }
        />
        <Route
          path="wishes"
          element={
            <React.Suspense fallback={<Loading />}>
              <Wishes />
            </React.Suspense>
          }
        />
        <Route
          path="contact"
          element={
            <React.Suspense fallback={<Loading />}>
              <Contact />
            </React.Suspense>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GuestAuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GuestAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
