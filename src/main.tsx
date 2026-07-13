import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import { HostLogin } from "@/routes/host-login";
import { AdminLayout } from "@/routes/admin/admin-layout";
import { AdminOverview } from "@/routes/admin/overview";
import { AdminGuests } from "@/routes/admin/guests";
import { AdminGroups } from "@/routes/admin/groups";
import { AdminEvents } from "@/routes/admin/events";
import { AdminInvitations } from "@/routes/admin/invitations";
import { AdminRsvps } from "@/routes/admin/rsvps";
import { AdminContent } from "@/routes/admin/content";
import { AdminGallery } from "@/routes/admin/gallery";
import { AdminSettings } from "@/routes/admin/settings";
import { AdminCoverEditor } from "@/routes/admin/cover-editor";
import { AdminThemeEditor } from "@/routes/admin/theme-editor";
import { GuestCover } from "@/routes/guest/cover";
import { GuestLogin } from "@/routes/guest/guest-login";
import { GuestLayout } from "@/routes/guest/guest-layout";
import { GuestHome } from "@/routes/guest/home";
import { GuestEvents } from "@/routes/guest/events";
import { GuestStory } from "@/routes/guest/story";
import { GuestGallery } from "@/routes/guest/gallery";
import { GuestTravel } from "@/routes/guest/travel";
import { GuestFaq } from "@/routes/guest/faq";
import { GuestRegistry } from "@/routes/guest/registry";
import { GuestContact } from "@/routes/guest/contact";
import { Landing } from "@/routes/landing";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } } });

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<HostLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/cover" element={<AdminRoute><AdminCoverEditor /></AdminRoute>} />
          <Route path="/admin/theme" element={<AdminRoute><AdminThemeEditor /></AdminRoute>} />
          <Route path="/admin/guests" element={<AdminRoute><AdminGuests /></AdminRoute>} />
          <Route path="/admin/groups" element={<AdminRoute><AdminGroups /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/invitations" element={<AdminRoute><AdminInvitations /></AdminRoute>} />
          <Route path="/admin/rsvps" element={<AdminRoute><AdminRsvps /></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
          <Route path="/admin/gallery" element={<AdminRoute><AdminGallery /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/w/:slug" element={<GuestCover />} />
          <Route path="/w/:slug/signin" element={<GuestLogin />} />
          <Route path="/w/:slug" element={<GuestLayout />}>
            <Route path="home" element={<GuestHome />} />
            <Route path="events" element={<GuestEvents />} />
            <Route path="story" element={<GuestStory />} />
            <Route path="gallery" element={<GuestGallery />} />
            <Route path="travel" element={<GuestTravel />} />
            <Route path="faq" element={<GuestFaq />} />
            <Route path="registry" element={<GuestRegistry />} />
            <Route path="contact" element={<GuestContact />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
