import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function useEventLiveUpdates(eventId: string, queryPrefixes: string[]) {
  const queryClient = useQueryClient();
  const prefixKey = queryPrefixes.join("|");

  useEffect(() => {
    const refresh = () => {
      for (const prefix of prefixKey.split("|")) {
        queryClient.invalidateQueries({ queryKey: [prefix, eventId] });
      }
    };

    let hasSubscribed = false;
    const channel = supabase
      .channel(`event-guest-answers-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_rsvps", filter: `event_id=eq.${eventId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_guests", filter: `event_id=eq.${eventId}` }, refresh)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (hasSubscribed) refresh();
        hasSubscribed = true;
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, prefixKey, queryClient]);
}
