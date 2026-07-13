import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type ThemeConfig } from "../../lib/supabase";
import { GuestAuthProvider } from "../../lib/guest-auth";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";

export default function RustyLayoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<UserEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("user_events")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Event not found");
          setEvent(null);
        } else {
          setEvent(data as UserEvent);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-2">
        <h1 className="text-xl font-semibold text-gray-900">Event not found</h1>
        <p className="text-sm text-gray-500">The event you're looking for doesn't exist or isn't published.</p>
      </div>
    );
  }

  // Merge RUSTY_THEME with the event's published theme (RUSTY_THEME takes priority for preset values)
  const mergedTheme: ThemeConfig = { ...RUSTY_THEME, ...(event.theme ?? {}) };

  return (
    <GuestAuthProvider>
      <EventThemeProvider initialTheme={mergedTheme}>
        <Outlet context={{ event }} />
      </EventThemeProvider>
    </GuestAuthProvider>
  );
}
