import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { Card, Skeleton, Badge, EmptyState } from "../../components/ui";
import { CalendarCheck } from "lucide-react";

export default function RsvpPage() {
  const { eventId } = useParams();
  const { data: rsvps, isLoading } = useQuery({
    queryKey: ["event-rsvps", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("submitted_at", { ascending: false }); if (error) throw error; return data as EventRsvp[]; },
  });

  const stats = { attending: rsvps?.filter((r) => r.status === "attending").length || 0, declined: rsvps?.filter((r) => r.status === "declined").length || 0, pending: rsvps?.filter((r) => r.status === "pending").length || 0, total: rsvps?.length || 0 };

  return (
    <div className="p-6">
      <h2 className="font-heading text-2xl text-gray-900 mb-6">RSVPs</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ label: "Attending", value: stats.attending, variant: "success" as const }, { label: "Declined", value: stats.declined, variant: "error" as const }, { label: "Pending", value: stats.pending, variant: "default" as const }, { label: "Total", value: stats.total, variant: "info" as const }].map((s) => (
          <Card key={s.label} className="text-center p-5"><p className="text-3xl font-heading text-gray-900">{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></Card>
        ))}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : !rsvps || rsvps.length === 0 ? <EmptyState icon={<CalendarCheck className="w-12 h-12" />} title="No RSVPs yet" description="RSVPs will appear here once guests respond." /> : (
        <div className="space-y-2">{rsvps.map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-3 px-5">
            <div><p className="font-medium text-gray-900">{r.guest_name}</p>{r.message && <p className="text-xs text-gray-500 mt-1">"{r.message}"</p>}</div>
            <div className="flex items-center gap-2">
              {r.plus_ones > 0 && <Badge>+{r.plus_ones}</Badge>}
              <Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "error" : "default"}>{r.status}</Badge>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  );
}
