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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
});

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
          <Route path="/admin/guests" element={<AdminRoute><AdminGuests /></AdminRoute>} />
          <Route path="/admin/groups" element={<AdminRoute><AdminGroups /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/invitations" element={<AdminRoute><AdminInvitations /></AdminRoute>} />
          <Route path="/admin/rsvps" element={<AdminRoute><AdminRsvps /></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
          <Route path="/admin/gallery" element={<AdminRoute><AdminGallery /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/w/:slug" element={<GuestLogin />} />
          <Route path="/w/:slug/home" element={<GuestLayout><GuestHome /></GuestLayout>} />
          <Route path="/w/:slug/events" element={<GuestLayout><GuestEvents /></GuestLayout>} />
          <Route path="/w/:slug/story" element={<GuestLayout><GuestStory /></GuestLayout>} />
          <Route path="/w/:slug/gallery" element={<GuestLayout><GuestGallery /></GuestLayout>} />
          <Route path="/w/:slug/travel" element={<GuestLayout><GuestTravel /></GuestLayout>} />
          <Route path="/w/:slug/faq" element={<GuestLayout><GuestFaq /></GuestLayout>} />
          <Route path="/w/:slug/registry" element={<GuestLayout><GuestRegistry /></GuestLayout>} />
          <Route path="/w/:slug/contact" element={<GuestLayout><GuestContact /></GuestLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
