import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Check, X, Clock } from "lucide-react";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { Card, Badge, EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/utils";

const statusVariants: Record<string, "success" | "error" | "warning"> = {
  attending: "success",
  declined: "error",
  pending: "warning",
};

export default function RsvpPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();

  const { data: rsvps, isLoading } = useQuery({
    queryKey: ["event-rsvps", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const attending = (rsvps ?? []).filter((r) => r.status === "attending").length;
  const declined = (rsvps ?? []).filter((r) => r.status === "declined").length;
  const pending = (rsvps ?? []).filter((r) => r.status === "pending").length;
  const total = rsvps?.length ?? 0;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">RSVPs</h2>
        <p className="text-sm text-gray-500">Track responses from your guests.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{pending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{total}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !rsvps || rsvps.length === 0 ? (
        <Card>
          <EmptyState
            title="No RSVPs yet"
            description="RSVP responses will appear here once guests respond."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Guest</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Plus ones</th>
                <th className="px-4 py-2 font-medium">Dietary</th>
                <th className="px-4 py-2 font-medium">Message</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{r.guest_name}</td>
                  <td className="px-4 py-2">
                    <Badge variant={statusVariants[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.plus_ones}</td>
                  <td className="px-4 py-2 text-gray-600">{r.dietary || "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-2 text-gray-600">{r.message || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(r.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
