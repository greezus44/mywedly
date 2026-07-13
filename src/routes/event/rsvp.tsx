import React from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Card, EmptyState, Badge } from "../../components/ui";
import { Mail, Check, X } from "lucide-react";
import { formatDateShort, formatTime12 } from "../../lib/utils";

export default function RsvpEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading } = useQuery({
    queryKey: ["rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", event.id).order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const attending = rsvps?.filter((r) => r.attending).length || 0;
  const declined = rsvps?.filter((r) => !r.attending).length || 0;
  const total = rsvps?.length || 0;

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">RSVP Responses</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-2xl font-bold text-dash-text">{total}</p><p className="text-sm text-dash-muted">Total</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-green-600">{attending}</p><p className="text-sm text-dash-muted">Attending</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-red-600">{declined}</p><p className="text-sm text-dash-muted">Declined</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-dash-text">{rsvps?.reduce((s, r) => s + r.plus_ones, 0) || 0}</p><p className="text-sm text-dash-muted">Plus Ones</p></Card>
      </div>
      {isLoading ? <div className="text-center py-12 text-dash-muted">Loading...</div> : !rsvps || rsvps.length === 0 ? (
        <EmptyState icon={<Mail className="w-12 h-12" />} title="No RSVPs yet" description="RSVP responses will appear here." />
      ) : (
        <div className="space-y-2">
          {rsvps.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-dash-text">{r.guest_name}</h3>
                  <p className="text-sm text-dash-muted">{formatDateShort(r.submitted_at)} at {formatTime12(r.submitted_at.slice(11, 16))}</p>
                  {r.message && <p className="text-sm text-dash-muted mt-1">{r.message}</p>}
                </div>
                <Badge variant={r.attending ? "success" : "danger"}>
                  {r.attending ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                  {r.attending ? "Attending" : "Declined"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
