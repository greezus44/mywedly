import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Card } from "../../components/ui";
import { Users, Mail, Check, X } from "lucide-react";

export default function AnalyticsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: stats } = useQuery({
    queryKey: ["analytics", event.id],
    queryFn: async () => {
      const [{ count: guestCount }, { data: rsvps }] = await Promise.all([
        supabase.from("event_guests").select("*", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("event_rsvps").select("*").eq("event_id", event.id),
      ]);
      const rsvpList = rsvps || [];
      return {
        guests: guestCount || 0,
        rsvps: rsvpList.length,
        attending: rsvpList.filter((r: any) => r.attending).length,
        declined: rsvpList.filter((r: any) => !r.attending).length,
      };
    },
  });

  const responseRate = stats && stats.guests > 0 ? Math.round((stats.rsvps / stats.guests) * 100) : 0;

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><Users className="w-6 h-6 text-dash-primary mb-2" /><p className="text-2xl font-bold text-dash-text">{stats?.guests || 0}</p><p className="text-sm text-dash-muted">Total Guests</p></Card>
        <Card className="p-4"><Mail className="w-6 h-6 text-dash-primary mb-2" /><p className="text-2xl font-bold text-dash-text">{stats?.rsvps || 0}</p><p className="text-sm text-dash-muted">RSVPs</p></Card>
        <Card className="p-4"><Check className="w-6 h-6 text-green-600 mb-2" /><p className="text-2xl font-bold text-green-600">{stats?.attending || 0}</p><p className="text-sm text-dash-muted">Attending</p></Card>
        <Card className="p-4"><X className="w-6 h-6 text-red-600 mb-2" /><p className="text-2xl font-bold text-red-600">{stats?.declined || 0}</p><p className="text-sm text-dash-muted">Declined</p></Card>
      </div>
      <Card className="p-4">
        <h3 className="font-medium text-dash-text mb-2">Response Rate</h3>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div className="h-full bg-dash-primary rounded-full transition-all" style={{ width: `${responseRate}%` }} />
        </div>
        <p className="text-sm text-dash-muted mt-2">{responseRate}% of guests have responded</p>
      </Card>
    </div>
  );
}
