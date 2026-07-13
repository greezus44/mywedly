import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import "./index.css";

import LandingPage from "./routes/landing";
import AuthPage from "./routes/auth";
import DashboardPage from "./routes/dashboard";

import EventLayout from "./routes/event/event-layout";
import CoverEditor from "./routes/event/cover-editor";
import LoginEditor from "./routes/event/login-editor";
import HomeEditor from "./routes/event/home-editor";
import EventsPage from "./routes/event/events";
import GuestsPage from "./routes/event/guests";
import GroupsPage from "./routes/event/groups";
import RsvpPage from "./routes/event/rsvp";
import TimelinePage from "./routes/event/timeline";
import PagesPage from "./routes/event/pages";
import PageBuilder from "./routes/event/page-builder";
import ThemeEditor from "./routes/event/theme-editor";
import SharingPage from "./routes/event/sharing";
import AnalyticsPage from "./routes/event/analytics";
import SettingsPage from "./routes/event/settings";

import GuestCover from "./routes/guest/cover";
import GuestLayout from "./routes/guest/guest-layout";
import GuestHome from "./routes/guest/home";
import GuestRsvp from "./routes/guest/rsvp";
import GuestWishes from "./routes/guest/wishes";
import GuestContact from "./routes/guest/contact";
import GuestCustomPage from "./routes/guest/custom-page";

import RustyCover from "./routes/guest/rusty-cover";
import RustyLayout from "./routes/guest/rusty-layout";
import RustyHome from "./routes/guest/rusty-home";
import RustyRsvp from "./routes/guest/rusty-rsvp";
import RustyWishes from "./routes/guest/rusty-wishes";
import RustyContact from "./routes/guest/rusty-contact";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GuestAuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/event/:eventId" element={<EventLayout />}>
                <Route index element={<CoverEditor />} />
                <Route path="login" element={<LoginEditor />} />
                <Route path="home" element={<HomeEditor />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="guests" element={<GuestsPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="rsvp" element={<RsvpPage />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="pages" element={<PagesPage />} />
                <Route path="pages/:pageId" element={<PageBuilder />} />
                <Route path="theme" element={<ThemeEditor />} />
                <Route path="sharing" element={<SharingPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="/e/:slug" element={<GuestCover />} />
              <Route path="/e/:slug/home" element={<GuestLayout />}><Route index element={<GuestHome />} /></Route>
              <Route path="/e/:slug/events" element={<GuestLayout />}><Route index element={<GuestHome />} /></Route>
              <Route path="/e/:slug/rsvp" element={<GuestLayout />}><Route index element={<GuestRsvp />} /></Route>
              <Route path="/e/:slug/wishes" element={<GuestLayout />}><Route index element={<GuestWishes />} /></Route>
              <Route path="/e/:slug/contact" element={<GuestLayout />}><Route index element={<GuestContact />} /></Route>
              <Route path="/e/:slug/p/:pageSlug" element={<GuestLayout />}><Route index element={<GuestCustomPage />} /></Route>

              <Route path="/r/:slug" element={<RustyCover />} />
              <Route path="/r/:slug/home" element={<RustyLayout />}><Route index element={<RustyHome />} /></Route>
              <Route path="/r/:slug/rsvp" element={<RustyLayout />}><Route index element={<RustyRsvp />} /></Route>
              <Route path="/r/:slug/wishes" element={<RustyLayout />}><Route index element={<RustyWishes />} /></Route>
              <Route path="/r/:slug/contact" element={<RustyLayout />}><Route index element={<RustyContact />} /></Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GuestAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
