import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router-dom";
import { supabase, type UserEvent } from "../../lib/supabase";
import { GuestAuthProvider } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export default function GuestLayoutPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error, refetch } = useQuery<UserEvent>({
    queryKey: ["published-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <ErrorState
          title="Event not found"
          message="This event may not exist or has not been published yet."
          onRetry={() => refetch()}
        />
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
