import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GuestAuthProvider } from "./lib/guest-auth";
import Landing from "./routes/landing";
import Auth from "./routes/auth";
import Dashboard from "./routes/dashboard";
import EventLayout from "./routes/event/event-layout";
import CoverEditor from "./routes/event/cover-editor";
import LoginEditor from "./routes/event/login-editor";
import HomeEditor from "./routes/event/home-editor";
import ThemeEditor from "./routes/event/theme-editor";
import EventsEditor from "./routes/event/events";
import GuestsEditor from "./routes/event/guests";
import GroupsEditor from "./routes/event/groups";
import RsvpEditor from "./routes/event/rsvp";
import TimelineEditor from "./routes/event/timeline";
import PagesEditor from "./routes/event/pages";
import PageBuilder from "./routes/event/page-builder";
import SharingEditor from "./routes/event/sharing";
import AnalyticsEditor from "./routes/event/analytics";
import SettingsEditor from "./routes/event/settings";
import GuestLayout from "./routes/guest/guest-layout";
import GuestCover from "./routes/guest/cover";
import GuestHome from "./routes/guest/home";
import GuestRsvp from "./routes/guest/rsvp";
import GuestWishes from "./routes/guest/wishes";
import GuestContact from "./routes/guest/contact";
import GuestCustomPage from "./routes/guest/custom-page";
import RustyLayout from "./routes/guest/rusty-layout";
import RustyCover from "./routes/guest/rusty-cover";
import RustyHome from "./routes/guest/rusty-home";
import RustyRsvp from "./routes/guest/rusty-rsvp";
import RustyWishes from "./routes/guest/rusty-wishes";
import RustyContact from "./routes/guest/rusty-contact";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/event/:eventId" element={<EventLayout />}>
                <Route index element={<Navigate to="cover" replace />} />
                <Route path="cover" element={<CoverEditor />} />
                <Route path="login" element={<LoginEditor />} />
                <Route path="home" element={<HomeEditor />} />
                <Route path="theme" element={<ThemeEditor />} />
                <Route path="events" element={<EventsEditor />} />
                <Route path="guests" element={<GuestsEditor />} />
                <Route path="groups" element={<GroupsEditor />} />
                <Route path="rsvp" element={<RsvpEditor />} />
                <Route path="timeline" element={<TimelineEditor />} />
                <Route path="pages" element={<PagesEditor />} />
                <Route path="pages/:pageId" element={<PageBuilder />} />
                <Route path="sharing" element={<SharingEditor />} />
                <Route path="analytics" element={<AnalyticsEditor />} />
                <Route path="settings" element={<SettingsEditor />} />
              </Route>
              <Route path="/e/:slug" element={<GuestLayout />}>
                <Route index element={<GuestCover />} />
                <Route path="home" element={<GuestHome />} />
                <Route path="rsvp" element={<GuestRsvp />} />
                <Route path="wishes" element={<GuestWishes />} />
                <Route path="contact" element={<GuestContact />} />
                <Route path="p/:pageSlug" element={<GuestCustomPage />} />
              </Route>
              <Route path="/r/:slug" element={<RustyLayout />}>
                <Route index element={<RustyCover />} />
                <Route path="home" element={<RustyHome />} />
                <Route path="rsvp" element={<RustyRsvp />} />
                <Route path="wishes" element={<RustyWishes />} />
                <Route path="contact" element={<RustyContact />} />
                <Route path="p/:pageSlug" element={<GuestCustomPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </GuestAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
