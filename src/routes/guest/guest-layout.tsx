import { useQuery } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router-dom";
import { supabase, type UserEvent } from "../../lib/supabase";
import { GuestAuthProvider } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { Skeleton, ErrorState } from "../../components/ui";

async function fetchPublishedEvent(slug: string): Promise<UserEvent> {
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (error) throw error;
  return data as UserEvent;
}

export default function GuestLayoutPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["published-event", slug],
    queryFn: () => fetchPublishedEvent(slug!),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <ErrorState message="Event not found or not yet published." />
      </div>
    );
  }

  return (
    <GuestAuthProvider>
      <EventThemeProvider initialTheme={event.theme}>
        <Outlet context={{ event }} />
      </EventThemeProvider>
    </GuestAuthProvider>
  );
}
