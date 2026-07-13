import { useParams, Outlet, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { EventThemeProvider } from "../../lib/theme-context";
import { DEFAULT_THEME } from "../../lib/theme";
import { Skeleton } from "../../components/ui";
import { GuestAuthProvider } from "../../lib/guest-auth";

export default function GuestLayoutPage() {
  const { slug } = useParams();
  const { data: event, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => { const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle(); if (error) throw error; return data as UserEvent | null; },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="w-32 h-8" /></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-sm text-gray-500 mb-4">Event not found</p><Link to="/" className="text-sm underline">Go home</Link></div></div>;

  return (
    <GuestAuthProvider>
      <EventThemeProvider initialTheme={event.theme || DEFAULT_THEME}>
        <div className="event-themed min-h-screen">
          <Outlet context={{ event }} />
        </div>
      </EventThemeProvider>
    </GuestAuthProvider>
  );
}
