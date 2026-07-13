import React from "react";
import { useParams, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { GuestAuthProvider } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";

export default function RustyLayout() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Event not found");
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading...</div>;
  if (error || !event) return <div className="min-h-screen flex items-center justify-center text-slate-600">Event not found.</div>;

  const mergedTheme = { ...RUSTY_THEME, ...event.theme };

  return (
    <GuestAuthProvider>
      <EventThemeProvider initialTheme={mergedTheme}>
        <Outlet context={{ event }} />
      </EventThemeProvider>
    </GuestAuthProvider>
  );
}
