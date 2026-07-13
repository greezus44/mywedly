import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./lib/lang-context";
import { GuestAuthProvider } from "./lib/guest-auth";
import "./index.css";

// Layouts (NOT lazy loaded)
import AdminLayout from "./routes/admin/admin-layout";
import GuestLayout from "./routes/guest/guest-layout";

// Lazy loaded page components
const Landing = lazy(() => import("./routes/landing"));
const AuthPage = lazy(() => import("./routes/auth"));

// Admin pages
const Overview = lazy(() => import("./routes/admin/overview"));
const CoverEditor = lazy(() => import("./routes/admin/cover-editor"));
const LoginEditor = lazy(() => import("./routes/admin/login-editor"));
const Content = lazy(() => import("./routes/admin/content"));
const ThemeEditor = lazy(() => import("./routes/admin/theme-editor"));
const Navigation = lazy(() => import("./routes/admin/navigation"));
const Footer = lazy(() => import("./routes/admin/footer"));
const ExtraPages = lazy(() => import("./routes/admin/extra-pages"));
const Guests = lazy(() => import("./routes/admin/guests"));
const GuestGroups = lazy(() => import("./routes/admin/guest-groups"));
const Imports = lazy(() => import("./routes/admin/imports"));
const Events = lazy(() => import("./routes/admin/events"));
const EventCategories = lazy(() => import("./routes/admin/event-categories"));
const Rsvp = lazy(() => import("./routes/admin/rsvp"));
const RsvpManagement = lazy(() => import("./routes/admin/rsvp-management"));
const EventInvitations = lazy(() => import("./routes/admin/event-invitations"));
const Gallery = lazy(() => import("./routes/admin/gallery"));
const Analytics = lazy(() => import("./routes/admin/analytics"));
const Sharing = lazy(() => import("./routes/admin/sharing"));
const Settings = lazy(() => import("./routes/admin/settings"));
const Branding = lazy(() => import("./routes/admin/branding"));
const Domains = lazy(() => import("./routes/admin/domains"));
const Integrations = lazy(() => import("./routes/admin/integrations"));
const Account = lazy(() => import("./routes/admin/account"));

// Guest pages
const GuestCover = lazy(() => import("./routes/guest/cover"));
const GuestLogin = lazy(() => import("./routes/guest/guest-login"));
const GuestHome = lazy(() => import("./routes/guest/home"));
const GuestRsvp = lazy(() => import("./routes/guest/rsvp"));
const GuestDoa = lazy(() => import("./routes/guest/doa"));
const GuestSendMessage = lazy(() => import("./routes/guest/send-message"));
const GuestContact = lazy(() => import("./routes/guest/contact"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <GuestAuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/admin-login" element={<Navigate to="/login" replace />} />

                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Overview />} />
                  <Route path="cover" element={<CoverEditor />} />
                  <Route path="login" element={<LoginEditor />} />
                  <Route path="home" element={<Content />} />
                  <Route path="theme" element={<ThemeEditor />} />
                  <Route path="navigation" element={<Navigation />} />
                  <Route path="footer" element={<Footer />} />
                  <Route path="extra-pages" element={<ExtraPages />} />
                  <Route path="guests" element={<Guests />} />
                  <Route path="guest-groups" element={<GuestGroups />} />
                  <Route path="imports" element={<Imports />} />
                  <Route path="events" element={<Events />} />
                  <Route path="event-categories" element={<EventCategories />} />
                  <Route path="rsvp" element={<Rsvp />} />
                  <Route path="rsvp-management" element={<RsvpManagement />} />
                  <Route path="event-invitations" element={<EventInvitations />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="sharing" element={<Sharing />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="branding" element={<Branding />} />
                  <Route path="domains" element={<Domains />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="account" element={<Account />} />
                </Route>

                {/* Guest routes */}
                <Route path="/:weddingId" element={<GuestCover />} />
                <Route path="/:weddingId/login" element={<GuestLogin />} />
                <Route element={<GuestLayout />}>
                  <Route path="/:weddingId/home" element={<GuestHome />} />
                  <Route path="/:weddingId/rsvp" element={<GuestRsvp />} />
                  <Route path="/:weddingId/doa" element={<GuestDoa />} />
                  <Route path="/:weddingId/send-message" element={<GuestSendMessage />} />
                  <Route path="/:weddingId/contact" element={<GuestContact />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </GuestAuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>
);
