import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import { AuthGate } from "@/lib/auth";
import { DashboardLayout } from "@/routes/dashboard";
import { ManagePage } from "@/routes/manage";
import { GuestCover } from "@/routes/guest-cover";
import { GuestInvitation } from "@/routes/guest-invitation";
import { GuestInfo } from "@/routes/guest-info";
import { GuestEvents } from "@/routes/guest-events";
import { GuestSignin } from "@/routes/guest-signin";
import { GuestCustomPage } from "@/routes/guest-custom-page";
import { Landing } from "@/routes/landing";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } } });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<AuthGate><DashboardLayout /></AuthGate>} />
          <Route path="/manage/:slug" element={<AuthGate><ManagePage /></AuthGate>} />
          <Route path="/w/:slug" element={<GuestCover />} />
          <Route path="/w/:slug/invitation" element={<GuestInvitation />} />
          <Route path="/w/:slug/info" element={<GuestInfo />} />
          <Route path="/w/:slug/events" element={<GuestEvents />} />
          <Route path="/w/:slug/signin" element={<GuestSignin />} />
          <Route path="/w/:slug/p/:pageSlug" element={<GuestCustomPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
