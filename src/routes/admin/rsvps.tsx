import { useCallback, useEffect, useState } from "react";
import {
  Check, X, Clock, Users, Download, Mail, MessageSquare,
  Utensils, Music, Heart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, WeddingEvent, Rsvp } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { formatDateShort, formatTime, downloadCsv, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, Badge, EmptyState, SectionTitle, Toast } from "@/components/ui";

export function AdminRsvps() {
  const { wedding, loading } = useHostWedding();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const weddingId = wedding?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [g, ev, rs] = await Promise.all([
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("full_name", { ascending: true }),
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      supabase.from("rsvps").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    ]);
    if (g.data) setGuests(g.data as Guest[]);
    if (ev.data) setEvents(ev.data as WeddingEvent[]);
    if (rs.data) setRsvps(rs.data as Rsvp[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId, fetchAll]);

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading RSVPs…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage RSVPs." />;
  }

  // ─── Summary stats ───
  const totalGuests = guests.length;
  const attending = guests.filter((g) => g.rsvp_status === "accepted" || g.rsvp_status === "attending").length;
  const declined = guests.filter((g) => g.rsvp_status === "declined").length;
  const tentative = guests.filter((g) => g.rsvp_status === "tentative").length;
  const pending = guests.filter((g) => !g.rsvp_status || g.rsvp_status === "pending").length;

  const summaryCards = [
    { label: "Total Guests", value: totalGuests, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Attending", value: attending, icon: Check, color: "text-green-600", bg: "bg-green-50" },
    { label: "Declined", value: declined, icon: X, color: "text-red-600", bg: "bg-red-50" },
    { label: "Tentative", value: tentative, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  // ─── Per-event breakdown ───
  const eventBreakdown = events.map((event) => {
    const eventRsvps = rsvps.filter((r) => r.event_id === event.id);
    const attendingCount = eventRsvps.filter((r) => r.status === "accepted" || r.status === "attending").length;
    const declinedCount = eventRsvps.filter((r) => r.status === "declined").length;
    const tentativeCount = eventRsvps.filter((r) => r.status === "tentative").length;
    const pendingCount = eventRsvps.filter((r) => r.status === "pending").length;
    return {
      event,
      attending: attendingCount,
      declined: declinedCount,
      tentative: tentativeCount,
      pending: pendingCount,
      total: eventRsvps.length,
    };
  });

  // ─── Filtered RSVPs ───
  const filtered = rsvps.filter((rsvp) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rsvp.guest_name.toLowerCase().includes(q) ||
      (rsvp.guest_email ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || rsvp.status === statusFilter;
    const matchesEvent = eventFilter === "all" || rsvp.event_id === eventFilter;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  // ─── CSV export ───
  const exportCsv = () => {
    const rows = rsvps.map((r) => {
      const event = events.find((e) => e.id === r.event_id);
      return {
        guest_name: r.guest_name,
        guest_email: r.guest_email ?? "",
        event: event?.name ?? "",
        status: r.status,
        meal_choice: r.meal_choice ?? "",
        dietary_restrictions: r.dietary_restrictions ?? "",
        song_request: r.song_request ?? "",
        plus_one_name: r.plus_one_name ?? "",
        message: r.message ?? "",
        submitted_at: formatDateShort(r.created_at),
      };
    });
    downloadCsv("rsvps.csv", rows);
    setToast({ message: "CSV exported", type: "success" });
  };

  const statusBadge = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
    if (status === "accepted" || status === "attending") return "success";
    if (status === "declined") return "danger";
    if (status === "tentative") return "warning";
    return "default";
  };

  return (
    <div>
      <SectionTitle
        title="RSVPs"
        subtitle="Track responses across all your wedding events."
        action={
          rsvps.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )
        }
      />

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-sepia/60 mb-1">
                  {card.label}
                </p>
                <p className="text-3xl font-serif text-onyx">{card.value}</p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", card.bg)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── Pending count ─── */}
      {pending > 0 && (
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-sepia">
              <span className="font-medium text-onyx">{pending}</span> {pending === 1 ? "guest has" : "guests have"} not responded yet.
            </p>
          </div>
        </Card>
      )}

      {/* ─── Per-event breakdown ─── */}
      {events.length > 0 && (
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-medium text-onyx mb-4">Per-Event Breakdown</h3>
          <div className="space-y-3">
            {eventBreakdown.map(({ event, attending: a, declined: d, tentative: t, pending: p, total }) => (
              <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-sand/50 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="info">{event.kind}</Badge>
                  <span className="text-sm font-medium text-onyx truncate">{event.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" /> {a}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="w-3 h-3" /> {t}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <X className="w-3 h-3" /> {d}
                  </span>
                  <span className="flex items-center gap-1 text-sepia/50">
                    <Users className="w-3 h-3" /> {p}
                  </span>
                  <span className="text-sepia/40 font-medium border-l border-sand pl-3">{total} total</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Search & filter ─── */}
      {rsvps.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by guest name or email…"
            className="flex-1"
          />
          <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="sm:w-48">
            <option value="all">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            <option value="all">All statuses</option>
            <option value="accepted">Accepted</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="tentative">Tentative</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
      )}

      {/* ─── RSVP table ─── */}
      {rsvps.length === 0 ? (
        <EmptyState
          title="No RSVPs yet"
          description="RSVP responses from your guests will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try adjusting your search or filters." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand bg-mist/30">
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3">Guest</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3 hidden md:table-cell">Event</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3 hidden lg:table-cell">Details</th>
                  <th className="text-left text-xs font-medium uppercase tracking-widest text-sepia/60 px-4 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rsvp) => {
                  const event = events.find((e) => e.id === rsvp.event_id);
                  return (
                    <tr key={rsvp.id} className="border-b border-sand/50 last:border-0 hover:bg-mist/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-onyx">{rsvp.guest_name}</p>
                        {rsvp.guest_email && (
                          <div className="flex items-center gap-1 text-xs text-sepia/50 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[160px]">{rsvp.guest_email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {event ? (
                          <span className="text-sm text-sepia/70">{event.name}</span>
                        ) : (
                          <span className="text-xs text-sepia/40">General</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge(rsvp.status)}>{rsvp.status}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="space-y-0.5">
                          {rsvp.meal_choice && (
                            <div className="flex items-center gap-1 text-xs text-sepia/60">
                              <Utensils className="w-3 h-3" /> {rsvp.meal_choice}
                            </div>
                          )}
                          {rsvp.plus_one_name && (
                            <div className="flex items-center gap-1 text-xs text-sepia/60">
                              <Heart className="w-3 h-3" /> +1: {rsvp.plus_one_name}
                            </div>
                          )}
                          {rsvp.song_request && (
                            <div className="flex items-center gap-1 text-xs text-sepia/60">
                              <Music className="w-3 h-3" /> {rsvp.song_request}
                            </div>
                          )}
                          {rsvp.message && (
                            <div className="flex items-center gap-1 text-xs text-sepia/60">
                              <MessageSquare className="w-3 h-3" /> <span className="truncate max-w-[150px]">{rsvp.message}</span>
                            </div>
                          )}
                          {!rsvp.meal_choice && !rsvp.plus_one_name && !rsvp.song_request && !rsvp.message && (
                            <span className="text-xs text-sepia/40">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-sepia/50">{formatDateShort(rsvp.created_at)}</span>
                        <br />
                        <span className="text-xs text-sepia/40">{formatTime(rsvp.created_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-sand bg-mist/20 text-xs text-sepia/60">
            Showing {filtered.length} of {rsvps.length} RSVPs
          </div>
        </Card>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
