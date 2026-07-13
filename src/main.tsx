import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "./lib/lang-context";
import { GuestAuthProvider } from "./lib/guest-auth";
import { Landing } from "./routes/landing";
import { HostLogin } from "./routes/host-login";
import { GuestLayout } from "./routes/guest/guest-layout";
import { Cover } from "./routes/guest/cover";
import { GuestLogin } from "./routes/guest/guest-login";
import { Home } from "./routes/guest/home";
import { Rsvp } from "./routes/guest/rsvp";
import { Doa } from "./routes/guest/doa";
import { SendMessage } from "./routes/guest/send-message";
import { Contact } from "./routes/guest/contact";
import { OverviewPage } from "./routes/admin/overview";
import { CoverEditorPage } from "./routes/admin/cover-editor";
import { ThemeEditorPage } from "./routes/admin/theme-editor";
import { ContentPage } from "./routes/admin/content";
import { ContentDoaPage } from "./routes/admin/content-doa";
import { ContentContactPage } from "./routes/admin/content-contact";
import { ContentMessagePage } from "./routes/admin/content-message";
import { EventsPage } from "./routes/admin/events";
import { GuestsPage } from "./routes/admin/guests";
import { MessagesPage } from "./routes/admin/messages";
import { SettingsPage } from "./routes/admin/settings";
import { RsvpsPage } from "./routes/admin/rsvps";
import { SharingPage } from "./routes/admin/sharing";
import { AnalyticsPage } from "./routes/admin/analytics";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/host-login" element={<HostLogin />} />
            <Route path="/w/:slug" element={<Cover />} />
            <Route path="/w/:slug/login" element={<GuestAuthProvider><GuestLogin /></GuestAuthProvider>} />
            <Route path="/w/:slug" element={<GuestAuthProvider><GuestLayout /></GuestAuthProvider>}>
              <Route path="home" element={<Home />} />
              <Route path="rsvp" element={<Rsvp />} />
              <Route path="doa" element={<Doa />} />
              <Route path="contact" element={<Contact />} />
              <Route path="send-message" element={<SendMessage />} />
            </Route>
            <Route path="/admin" element={<OverviewPage />} />
            <Route path="/admin/cover" element={<CoverEditorPage />} />
            <Route path="/admin/theme" element={<ThemeEditorPage />} />
            <Route path="/admin/content" element={<ContentPage />} />
            <Route path="/admin/content/doa" element={<ContentDoaPage />} />
            <Route path="/admin/content/contact" element={<ContentContactPage />} />
            <Route path="/admin/content/message" element={<ContentMessagePage />} />
            <Route path="/admin/events" element={<EventsPage />} />
            <Route path="/admin/guests" element={<GuestsPage />} />
            <Route path="/admin/messages" element={<MessagesPage />} />
            <Route path="/admin/rsvps" element={<RsvpsPage />} />
            <Route path="/admin/sharing" element={<SharingPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>
);
