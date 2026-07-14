import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type EventMessage } from "../../lib/supabase";
import { Card, LoadingSpinner, ErrorState } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function AnalyticsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();

  const { data: guests } = useQuery({
    queryKey: ["event-guests-analytics", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });
  const { data: rsvps } = useQuery({
    queryKey: ["event-rsvps-analytics", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId); if (error) throw error; return data as EventRsvp[]; },
  });
  const { data: messages } = useQuery({
    queryKey: ["event-messages-analytics", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId); if (error) throw error; return data as EventMessage[]; },
  });

  const totalGuests = guests?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = totalGuests - attending - declined;
  const totalMessages = messages?.length ?? 0;

  const stats = [
    { label: "Total Guests", value: totalGuests },
    { label: "Attending", value: attending },
    { label: "Declined", value: declined },
    { label: "Pending", value: pending },
    { label: "Wishes", value: totalMessages },
  ];

  if (!guests) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Analytics</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-2xl font-bold text-dash-text">{s.value}</p>
            <p className="mt-1 text-xs text-dash-muted">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
        <div className="space-y-2">
          {stats.slice(1, 4).map((s) => {
            const pct = totalGuests > 0 ? Math.round((s.value / totalGuests) * 100) : 0;
            return (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-dash-muted"><span>{s.label}</span><span>{s.value} ({pct}%)</span></div>
                <div className="mt-1 h-2 rounded-full bg-dash-bg"><div className="h-2 rounded-full bg-dash-primary" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
