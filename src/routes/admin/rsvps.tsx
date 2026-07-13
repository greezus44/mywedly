import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Rsvp, RsvpStatus } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { downloadCsv, formatDate } from "@/lib/utils";
import { Download, Check, X, Clock, MessageSquare } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type RsvpWithJoins = Rsvp & {
  events: { name: string } | null;
  guests: { full_name: string } | null;
};

type StatusMeta = {
  label: string;
  variant: "success" | "danger" | "warning" | "default";
  icon: typeof Check;
};

const STATUS_META: Record<RsvpStatus, StatusMeta> = {
  accepted: { label: "Attending", variant: "success", icon: Check },
  declined: { label: "Declined", variant: "danger", icon: X },
  tentative: { label: "Tentative", variant: "warning", icon: Clock },
  pending: { label: "Pending", variant: "default", icon: Clock },
};

const STATUSES: RsvpStatus[] = ["accepted", "declined", "tentative", "pending"];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AdminRsvps() {
  const { wedding, loading } = useHostWedding();

  const [rsvps, setRsvps] = useState<RsvpWithJoins[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  /* ---------------- fetch ---------------- */

  const fetchRsvps = useCallback(async () => {
    if (!wedding) return;
    setDataLoading(true);

    const { data, error } = await supabase
      .from("rsvps")
      .select("*, events(name), guests(full_name)")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch RSVPs error", error);
    }
    setRsvps((data as RsvpWithJoins[] | null) ?? []);
    setDataLoading(false);
  }, [wedding]);

  useEffect(() => {
    fetchRsvps();
  }, [fetchRsvps]);

  /* ---------------- toast ---------------- */

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  /* ---------------- derived data ---------------- */

  const summary = useMemo(() => {
    const counts: Record<RsvpStatus, number> = {
      accepted: 0,
      declined: 0,
      tentative: 0,
      pending: 0,
    };
    for (const r of rsvps) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  }, [rsvps]);

  const perEvent = useMemo(() => {
    const map = new Map<
      string,
      { name: string; accepted: number; declined: number; tentative: number; pending: number; total: number }
    >();

    for (const r of rsvps) {
      const key = r.event_id ?? "unassigned";
      const name = r.event_id ? (r.events?.name ?? "Unknown Event") : "Unassigned";
      if (!map.has(key)) {
        map.set(key, { name, accepted: 0, declined: 0, tentative: 0, pending: 0, total: 0 });
      }
      const entry = map.get(key)!;
      entry[r.status] = (entry[r.status] ?? 0) + 1;
      entry.total += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rsvps]);

  /* ---------------- CSV export ---------------- */

  const exportCsv = () => {
    if (rsvps.length === 0) {
      showToast("No RSVPs to export");
      return;
    }
    const rows = rsvps.map((r) => ({
      guest_name: r.guest_name,
      guest_email: r.guest_email ?? "",
      event: r.events?.name ?? "",
      status: STATUS_META[r.status].label,
      meal_choice: r.meal_choice ?? "",
      dietary_restrictions: r.dietary_restrictions ?? "",
      plus_one_name: r.plus_one_name ?? "",
      message: r.message ?? "",
      date_submitted: r.created_at ? formatDate(r.created_at) : "",
    }));
    downloadCsv("rsvps.csv", rows);
    showToast("CSV exported");
  };

  /* ---------------- render ---------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <EmptyState
        title="No wedding found"
        description="Create a wedding to manage RSVPs."
      />
    );
  }

  const summaryCards = [
    {
      label: "Total RSVPs",
      value: rsvps.length,
      icon: MessageSquare,
      variant: "default" as const,
      accent: "text-onyx",
    },
    {
      label: "Attending",
      value: summary.accepted,
      icon: Check,
      variant: "success" as const,
      accent: "text-green-700",
    },
    {
      label: "Declined",
      value: summary.declined,
      icon: X,
      variant: "danger" as const,
      accent: "text-red-700",
    },
    {
      label: "Tentative / Pending",
      value: summary.tentative + summary.pending,
      icon: Clock,
      variant: "warning" as const,
      accent: "text-yellow-700",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionTitle
        title="RSVPs"
        subtitle="Track responses across all your wedding events."
        action={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rsvps.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      {/* ---------------- Summary cards ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-sepia/70">
                {s.label}
              </span>
              <s.icon className={`w-4 h-4 ${s.accent}`} />
            </div>
            <span className="font-serif text-3xl text-onyx">
              {dataLoading ? "—" : s.value}
            </span>
          </Card>
        ))}
      </div>

      {/* ---------------- Per-event breakdown ---------------- */}
      {perEvent.length > 0 && (
        <div>
          <h2 className="font-serif text-lg text-onyx mb-4">Per-Event Breakdown</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perEvent.map((evt) => (
              <Card key={evt.name} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-onyx truncate">{evt.name}</h3>
                  <Badge variant="default">{evt.total}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-sepia">Attending</span>
                    <span className="ml-auto font-medium text-onyx">{evt.accepted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-sepia">Declined</span>
                    <span className="ml-auto font-medium text-onyx">{evt.declined}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    <span className="text-sepia">Tentative</span>
                    <span className="ml-auto font-medium text-onyx">{evt.tentative}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sepia/50" />
                    <span className="text-sepia">Pending</span>
                    <span className="ml-auto font-medium text-onyx">{evt.pending}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Full RSVP table ---------------- */}
      <Card className="p-0 overflow-hidden">
        {dataLoading ? (
          <div className="p-12 text-center text-sepia text-sm">Loading RSVPs…</div>
        ) : rsvps.length === 0 ? (
          <EmptyState
            title="No RSVPs yet"
            description="RSVPs from your guests will appear here once they respond."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand bg-mist/50">
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Guest</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Event</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Status</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Meal</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Dietary</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Plus One</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Message</th>
                  <th className="text-left font-medium uppercase tracking-widest text-xs text-sepia px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((rsvp) => {
                  const meta = STATUS_META[rsvp.status];
                  return (
                    <tr
                      key={rsvp.id}
                      className="border-b border-sand/60 last:border-0 hover:bg-mist/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-onyx">{rsvp.guest_name}</div>
                        {rsvp.guest_email && (
                          <div className="text-xs text-sepia/60">{rsvp.guest_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {rsvp.events?.name ?? (
                          <span className="text-sepia/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {rsvp.meal_choice ?? <span className="text-sepia/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {rsvp.dietary_restrictions ?? <span className="text-sepia/40">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sepia">
                        {rsvp.plus_one_name ?? <span className="text-sepia/40">—</span>}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {rsvp.message ? (
                          <div className="flex items-start gap-1.5 text-sepia">
                            <MessageSquare className="w-3.5 h-3.5 text-sepia/50 shrink-0 mt-0.5" />
                            <span className="truncate" title={rsvp.message}>
                              {rsvp.message}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sepia/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sepia whitespace-nowrap text-xs">
                        {rsvp.created_at ? formatDate(rsvp.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------- Count footer ---------------- */}
      {!dataLoading && rsvps.length > 0 && (
        <p className="text-xs text-sepia/60">
          {rsvps.length} RSVP{rsvps.length === 1 ? "" : "s"} total
        </p>
      )}

      {/* ---------------- Toast ---------------- */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-2 bg-onyx text-parchment px-4 py-2.5 rounded-md shadow-lg text-sm">
            <Check className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRsvps;
