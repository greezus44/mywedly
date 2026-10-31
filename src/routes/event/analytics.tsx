import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { fetchAllRows } from "../../lib/fetch-all";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function AnalyticsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();

  const { data: guests } = useQuery({
    queryKey: ["event-guests-analytics", eventId],
    queryFn: () => fetchAllRows<{ id: string }>((from, to) => supabase.from("event_guests").select("id").eq("event_id", eventId).order("id").range(from, to)),
  });
  const { data: messages } = useQuery({
    queryKey: ["event-messages-analytics", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId); if (error) throw error; return data as EventMessage[]; },
  });

  const totalGuests = guests?.length ?? 0;
  const totalMessages = messages?.length ?? 0;

  const stats = [
    { label: "Total Guests", value: totalGuests },
    { label: "Messages", value: totalMessages },
  ];

  if (!guests) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-2xl font-bold text-dash-text">{s.value}</p>
            <p className="mt-1 text-xs text-dash-muted">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
