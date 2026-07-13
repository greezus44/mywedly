import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, X, Clock, Download, MessageSquare, Utensils, Music, Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, WeddingEvent, Rsvp } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Card, Badge, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { cn, formatDateShort, formatTime, downloadCsv } from "@/lib/utils";

type SummaryCard = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
};

export function AdminRsvps() {
  const { wedding, loading } = useHostWedding();
  const weddingId = wedding?.id ?? "";

  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [eventFilter, setEventFilter] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load ───
  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [g, ev, r] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      supabase.from("rsvps").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    ]);
    if (g.data) setGuests(g.data as Guest[]);
    if (ev.data) setEvents(ev.data as WeddingEvent[]);
    if (r.data) setRsvps(r.data as Rsvp[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // ─── Derived ───
  const summary = useMemo(() => {
    const accepted = rsvps.filter((r) => r.status === "accepted").length;
    const declined = rsvps.filter((r) => r.status === "declined").length;
    const tentative = rsvps.filter((r) => r.status === "tentative").length;
    const pending = guests.length - accepted - declined - tentative;
    return { total: guests.length, accepted, declined, tentative, pending };
  }, [rsvps, guests]);

  const filteredRsvps = useMemo(() => {
    if (eventFilter === "all") return rsvps;
    return rsvps.filter((r) => r.event_id === eventFilter);
  }, [rsvps, eventFilter]);

  // Per-event breakdown
  const eventBreakdown = useMemo(() => {
    return events.map((event) => {
      const eventRsvps = rsvps.filter((r) => r.event_id === event.id);
      return {
        event,
        accepted: eventRsvps.filter((r) => r.status === "accepted").length,
        declined: eventRsvps.filter((r) => r.status === "declined").length,
        tentative: eventRsvps.filter((r) => r.status === "tentative").length,
        total: eventRsvps.length,
      };
    });
  }, [events, rsvps]);

  const eventName = (eventId: string | null) =>
    events.find((e) => e.id === eventId)?.name ?? "General";

  const summaryCards: SummaryCard[] = [
    { label: "Total", value: summary.total, icon: MessageSquare, accent: "text-onyx", bg: "bg-mist" },
    { label: "Attending", value: summary.accepted, icon: Check, accent: "text-green-600", bg: "bg-green-50" },
    { label: "Declined", value: summary.declined, icon: X, accent: "text-red-600", bg: "bg-red-50" },
    { label: "Tentative", value: summary.tentative, icon: Clock, accent: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  // ─── CSV export ───
  const exportCsv = () => {
    const rows = rsvps.map((r) => ({
      guest_name: r.guest_name,
      guest_email: r.guest_email ?? "",
      status: r.status,
      event: eventName(r.event_id),
      meal_choice: r.meal_choice ?? "",
      dietary_restrictions: r.dietary_restrictions ?? "",
      song_request: r.song_request ?? "",
      plus_one_name: r.plus_one_name ?? "",
      message: r.message ?? "",
      submitted_at: formatDateShort(r.created_at),
    }));
    downloadCsv("rsvps.csv", rows);
    showToast("RSVPs exported");
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading RSVPs…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to view RSVPs." />;
  }

  return (
    <div>
      <SectionTitle
        title="RSVPs"
        subtitle={`${summary.accepted} attending · ${summary.declined} declined · ${summary.pending} pending`}
        action={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rsvps.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        }
      />

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", card.bg)}>
              <card.icon className={cn("w-5 h-5", card.accent)} />
            </div>
            <div className="text-3xl font-serif text-onyx">{card.value}</div>
            <div className="text-xs text-sepia/70 uppercase tracking-widest mt-0.5">{card.label}</div>
          </Card>
        ))}
      </div>

      {/* ─── Per-event breakdown ─── */}
      {events.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="font-serif text-lg text-onyx mb-4">Per-Event Breakdown</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventBreakdown.map(({ event, accepted, declined, tentative, total }) => (
              <div key={event.id} className="p-4 rounded-lg border border-sand bg-mist/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-onyx truncate">{event.name}</p>
                    <p className="text-xs text-sepia/60">{formatDateShort(event.starts_at)}</p>
                  </div>
                  <Badge>{event.kind}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" /> {accepted}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="w-3 h-3" /> {tentative}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <X className="w-3 h-3" /> {declined}
                  </span>
                  <span className="text-sepia/50 ml-auto">{total} total</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Filter ─── */}
      {events.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-sepia">Filter by event:</span>
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-auto min-w-[200px]"
          >
            <option value="all">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </div>
      )}

      {/* ─── RSVP table ─── */}
      {filteredRsvps.length === 0 ? (
        <EmptyState
          title={rsvps.length === 0 ? "No RSVPs yet" : "No RSVPs for this event"}
          description={rsvps.length === 0 ? "RSVPs will appear here once guests respond." : "Try a different event filter."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand bg-mist/50">
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3">Guest</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3 hidden md:table-cell">Event</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3 hidden lg:table-cell">Meal</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3 hidden lg:table-cell">+1</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia px-4 py-3 hidden xl:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredRsvps.map((rsvp) => {
                  const variant =
                    rsvp.status === "accepted" ? "success" :
                    rsvp.status === "declined" ? "danger" :
                    rsvp.status === "tentative" ? "warning" : "default";
                  return (
                    <tr key={rsvp.id} className="border-b border-sand last:border-0 hover:bg-mist/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-onyx">{rsvp.guest_name}</p>
                        {rsvp.guest_email && (
                          <p className="text-xs text-sepia/60 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {rsvp.guest_email}
                          </p>
                        )}
                        {rsvp.message && (
                          <p className="text-xs text-sepia/70 italic mt-1 max-w-xs truncate">"{rsvp.message}"</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant as "success" | "danger" | "warning" | "default"} className="capitalize">
                          {rsvp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-sepia">{eventName(rsvp.event_id)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {rsvp.meal_choice ? (
                          <span className="text-sm text-sepia flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-sepia/40" />
                            {rsvp.meal_choice}
                          </span>
                        ) : <span className="text-sepia/40 text-sm">—</span>}
                        {rsvp.dietary_restrictions && (
                          <p className="text-xs text-sepia/60 mt-0.5">{rsvp.dietary_restrictions}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {rsvp.plus_one_name ? (
                          <span className="text-sm text-sepia">{rsvp.plus_one_name}</span>
                        ) : <span className="text-sepia/40 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-sepia/60">{formatDateShort(rsvp.created_at)}</span>
                        <p className="text-xs text-sepia/40">{formatTime(rsvp.created_at)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminRsvps;
