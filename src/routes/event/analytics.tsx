import { useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, XCircle, Clock, Mail, BarChart3, Calendar } from "lucide-react";
import { supabase, UserEvent, EventGuest, EventRsvp, EventMessage } from "../../lib/supabase";
import { Card, EmptyState, Skeleton, ErrorState } from "../../components/ui/index";
import { formatDateShort } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

interface AnalyticsData {
  totalGuests: number;
  attending: number;
  declined: number;
  pending: number;
  maybe: number;
  plusOnes: number;
  totalRsvps: number;
  messages: number;
}

export default function AnalyticsPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ["analytics", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("No event ID");

      const [guestsRes, rsvpsRes, messagesRes] = await Promise.all([
        supabase.from("event_guests").select("*").eq("event_id", eventId),
        supabase.from("event_rsvps").select("*").eq("event_id", eventId),
        supabase.from("event_messages").select("*").eq("event_id", eventId),
      ]);

      if (guestsRes.error) throw guestsRes.error;
      if (rsvpsRes.error) throw rsvpsRes.error;
      if (messagesRes.error) throw messagesRes.error;

      const guests = (guestsRes.data || []) as EventGuest[];
      const rsvps = (rsvpsRes.data || []) as EventRsvp[];
      const messages = (messagesRes.data || []) as EventMessage[];

      return {
        totalGuests: guests.length,
        attending: guests.filter((g) => g.rsvp_status === "attending").length,
        declined: guests.filter((g) => g.rsvp_status === "not_attending").length,
        pending: guests.filter((g) => g.rsvp_status === "pending").length,
        maybe: guests.filter((g) => g.rsvp_status === "maybe").length,
        plusOnes: guests.reduce((sum, g) => sum + (g.plus_ones || 0), 0),
        totalRsvps: rsvps.length,
        messages: messages.length,
      };
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const rsvpRate = useMemo(() => {
    if (!data || data.totalGuests === 0) return 0;
    return Math.round(((data.attending + data.declined + data.maybe) / data.totalGuests) * 100);
  }, [data]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Track your event engagement</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !data ? (
        <EmptyState icon={<BarChart3 className="w-12 h-12" />} title="No data available" description="Analytics will appear once you have guests" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Total Guests"
              value={data.totalGuests}
              color="gray"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Attending"
              value={data.attending}
              color="green"
            />
            <StatCard
              icon={<XCircle className="w-5 h-5" />}
              label="Declined"
              value={data.declined}
              color="red"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Pending"
              value={data.pending}
              color="yellow"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Mail className="w-5 h-5" />}
              label="Messages"
              value={data.messages}
              color="gray"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="RSVP Responses"
              value={data.totalRsvps}
              color="blue"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Plus Ones"
              value={data.plusOnes}
              color="gray"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Response Rate"
              value={`${rsvpRate}%`}
              color="green"
            />
          </div>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">RSVP Breakdown</h3>
            <div className="space-y-3">
              <ProgressBar label="Attending" value={data.attending} total={data.totalGuests} color="bg-green-500" />
              <ProgressBar label="Declined" value={data.declined} total={data.totalGuests} color="bg-red-500" />
              <ProgressBar label="Maybe" value={data.maybe} total={data.totalGuests} color="bg-yellow-500" />
              <ProgressBar label="Pending" value={data.pending} total={data.totalGuests} color="bg-gray-300" />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Estimated Headcount</h3>
              <p className="text-3xl font-bold text-gray-900">
                {data.attending + data.plusOnes}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.attending} attending + {data.plusOnes} plus ones
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Event Date</h3>
              <p className="text-lg font-semibold text-gray-900">
                {event.event_date ? formatDateShort(event.event_date) : "Not set"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{event.venue || "No venue set"}</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "gray" | "green" | "red" | "yellow" | "blue";
}) {
  const iconColors = {
    gray: "text-gray-400",
    green: "text-green-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
    blue: "text-blue-500",
  };
  return (
    <Card className="p-4">
      <div className={"flex items-center gap-2 mb-2 " + iconColors[color]}>
        {icon}
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </Card>
  );
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {value} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={"h-full rounded-full transition-all " + color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
