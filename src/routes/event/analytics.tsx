import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Card, Skeleton } from "../../components/ui";
import { Users, CalendarCheck } from "lucide-react";

export default function AnalyticsPage() {
  const { eventId } = useParams();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["event-analytics", eventId],
    queryFn: async () => {
      const [guests, rsvps] = await Promise.all([
        supabase.from("event_guests").select("*", { count: "exact", head: true }).eq("event_id", eventId),
        supabase.from("event_rsvps").select("status").eq("event_id", eventId),
      ]);
      const rsvpList = rsvps.data || [];
      return { totalGuests: guests.count || 0, attending: rsvpList.filter((r) => r.status === "attending").length, declined: rsvpList.filter((r) => r.status === "declined").length, pending: rsvpList.filter((r) => r.status === "pending").length, totalRsvps: rsvpList.length };
    },
  });

  const cards = [
    { label: "Total Guests", value: stats?.totalGuests || 0, icon: Users, color: "text-gray-600" },
    { label: "Attending", value: stats?.attending || 0, icon: CalendarCheck, color: "text-green-600" },
    { label: "Declined", value: stats?.declined || 0, icon: CalendarCheck, color: "text-red-600" },
    { label: "Pending", value: stats?.pending || 0, icon: CalendarCheck, color: "text-gray-400" },
  ];

  return (
    <div className="p-6">
      <h2 className="font-heading text-2xl text-gray-900 mb-6">Analytics</h2>
      {isLoading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{cards.map((c) => (
            <Card key={c.label} className="p-5"><div className="flex items-center justify-between mb-2"><c.icon className={`w-5 h-5 ${c.color}`} /></div><p className="text-3xl font-heading text-gray-900">{c.value}</p><p className="text-xs text-gray-500 mt-1">{c.label}</p></Card>
          ))}</div>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">RSVP Response Rate</h3>
            {stats && stats.totalRsvps > 0 ? (
              <div><div className="flex h-8 rounded-full overflow-hidden"><div className="bg-green-500" style={{ width: `${(stats.attending / stats.totalRsvps) * 100}%` }} /><div className="bg-red-400" style={{ width: `${(stats.declined / stats.totalRsvps) * 100}%` }} /><div className="bg-gray-200" style={{ width: `${(stats.pending / stats.totalRsvps) * 100}%` }} /></div><div className="flex justify-between mt-2 text-xs text-gray-500"><span>{Math.round((stats.totalRsvps / Math.max(stats.totalGuests, 1)) * 100)}% response rate</span><span>{stats.totalRsvps} of {stats.totalGuests} responded</span></div></div>
            ) : <p className="text-sm text-gray-400">No RSVP data yet.</p>}
          </Card>
        </>
      )}
    </div>
  );
}
