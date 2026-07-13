import React, { Suspense, lazy, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "./lib/supabase";
import { GuestAuthProvider } from "./lib/guest-auth";
import EventLayout from "./routes/event/event-layout";
import GuestLayout from "./routes/guest/guest-layout";
import "./index.css";

// Lazy-loaded page components
const Landing = lazy(() => import("./routes/landing"));
const Auth = lazy(() => import("./routes/auth"));
const Dashboard = lazy(() => import("./routes/dashboard"));
const Account = lazy(() => import("./routes/account"));

// Event editor routes (nested under EventLayout)
const CoverEditor = lazy(() => import("./routes/event/cover-editor"));
const LoginEditor = lazy(() => import("./routes/event/login-editor"));
const HomeEditor = lazy(() => import("./routes/event/home-editor"));
const ThemeEditor = lazy(() => import("./routes/event/theme-editor"));
const BrandingEditor = lazy(() => import("./routes/event/branding"));
const Guests = lazy(() => import("./routes/event/guests"));
const RsvpManagement = lazy(() => import("./routes/event/rsvp"));
const Timeline = lazy(() => import("./routes/event/timeline"));
const QrCodes = lazy(() => import("./routes/event/qr-codes"));
const Analytics = lazy(() => import("./routes/event/analytics"));
const Settings = lazy(() => import("./routes/event/settings"));
const Sharing = lazy(() => import("./routes/event/sharing"));

// Guest-facing routes
const Cover = lazy(() => import("./routes/guest/cover"));
const GuestLogin = lazy(() => import("./routes/guest/guest-login"));
const Home = lazy(() => import("./routes/guest/home"));
const Rsvp = lazy(() => import("./routes/guest/rsvp"));
const Wishes = lazy(() => import("./routes/guest/wishes"));
const Contact = lazy(() => import("./routes/guest/contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        setStatus(data.user ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") return <Loading />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GuestAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />

              {/* Protected */}
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

              {/* Event editor (authenticated organizer area) */}
              <Route path="/event/:eventId" element={<EventLayout />}>
                <Route index element={<Navigate to="cover" replace />} />
                <Route path="cover" element={<CoverEditor />} />
                <Route path="login" element={<LoginEditor />} />
                <Route path="home" element={<HomeEditor />} />
                <Route path="theme" element={<ThemeEditor />} />
                <Route path="branding" element={<BrandingEditor />} />
                <Route path="guests" element={<Guests />} />
                <Route path="rsvp" element={<RsvpManagement />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="qr-codes" element={<QrCodes />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="sharing" element={<Sharing />} />
              </Route>

              {/* Guest-facing event site */}
              <Route path="/:eventId" element={<Cover />} />
              <Route path="/:eventId/login" element={<GuestLogin />} />
              <Route path="/:eventId/home" element={<GuestLayout />}>
                <Route index element={<Home />} />
                <Route path="rsvp" element={<Rsvp />} />
                <Route path="wishes" element={<Wishes />} />
                <Route path="contact" element={<Contact />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </GuestAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
