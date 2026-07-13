import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router-dom";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { RUSTY_THEME } from "../../lib/theme";
import { GuestAuthProvider } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { LoadingSpinner, ErrorState } from "../../components/ui";

export default function RustyLayoutPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error, refetch } = useQuery<UserEvent>({
    queryKey: ["published-event-rusty", slug],
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

  // Merge RUSTY_THEME with event.theme
  const mergedTheme = useMemo<ThemeConfig | null>(() => {
    if (!event?.theme) return RUSTY_THEME;
    return { ...RUSTY_THEME, ...event.theme };
  }, [event?.theme]);

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
      <EventThemeProvider initialTheme={mergedTheme}>
        <Outlet context={{ event }} />
      </EventThemeProvider>
    </GuestAuthProvider>
  );
}
