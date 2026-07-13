import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, MailOpen, Check, X } from "lucide-react";
import { supabase, type UserEvent, type EventGuest, type EventRsvp } from "../../lib/supabase";
import { Card } from "../../components/ui";

export default function AnalyticsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ["event-guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id);
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["event-rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  if (guestsLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const totalGuests = guests?.length ?? 0;
  const totalRsvps = rsvps?.length ?? 0;
  const attending = (rsvps ?? []).filter((r) => r.status === "attending").length;
  const declined = (rsvps ?? []).filter((r) => r.status === "declined").length;
  const responseRate = totalGuests > 0 ? Math.round((totalRsvps / totalGuests) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500">Overview of guest engagement and RSVPs.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-500">Total guests</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalGuests}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MailOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-500">Responses</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalRsvps}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-500">Attending</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{attending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-500">Declined</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{declined}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Response rate</h3>
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gray-900 transition-all"
              style={{ width: `${responseRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900">{responseRate}%</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {totalRsvps} of {totalGuests} guests have responded.
        </p>
      </Card>
    </div>
  );
}
