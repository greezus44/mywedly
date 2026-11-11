import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventGuest, type SubEvent, type EventRsvp } from "../../lib/supabase";

const MAIN_KEY = "__main__";
const PREVIEW_COUNT = 10;
const OPEN_KEY = "guests-activity-open";

type ActivityRow = Pick<EventRsvp, "guest_id" | "sub_event_id" | "status" | "responded_at">;

interface ActivityEntry {
  guest: EventGuest;
  eventKey: string;
  status: string;
  at: string;
  isNew: boolean;
}

interface RecentRsvpActivityProps {
  eventId: string;
  eventName: string;
  guests: EventGuest[];
  visibleGuestIds: Set<string>;
  subEvents: SubEvent[] | undefined;
  onEdit: (guest: EventGuest) => void;
}

function statusText(status: string): { label: string; className: string } {
  if (status === "attending") return { label: "Attending", className: "text-green-600" };
  if (status === "declined") return { label: "Declined", className: "text-red-500" };
  return { label: "Pending", className: "text-dash-muted" };
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function RecentRsvpActivity({ eventId, eventName, guests, visibleGuestIds, subEvents, onEdit }: RecentRsvpActivityProps) {
  const [open, setOpen] = useState(() => {
    const saved = window.localStorage.getItem(OPEN_KEY);
    return saved === null ? window.matchMedia("(min-width: 640px)").matches : saved === "true";
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(OPEN_KEY, String(open));
  }, [open]);

  const { data: rows, isLoading, isError } = useQuery({
    queryKey: ["recent-rsvp-activity", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("guest_id, sub_event_id, status, responded_at")
        .eq("event_id", eventId)
        .not("responded_at", "is", null)
        .order("responded_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const repliedGuestIds = new Set((rows ?? []).map((r) => r.guest_id));

  const replyEntries: ActivityEntry[] = (rows ?? []).flatMap((r) => {
    const guest = guestById.get(r.guest_id);
    if (!guest || !r.responded_at) return [];
    return [{ guest, eventKey: r.sub_event_id ?? MAIN_KEY, status: r.status, at: r.responded_at, isNew: false }];
  });

  const registrationEntries: ActivityEntry[] = guests.flatMap((g) =>
    g.open_rsvp_link_id && !repliedGuestIds.has(g.id)
      ? [{ guest: g, eventKey: MAIN_KEY, status: g.rsvp_status, at: g.created_at, isNew: true }]
      : [],
  );

  const entries = [...replyEntries, ...registrationEntries]
    .filter((e) => visibleGuestIds.has(e.guest.id))
    .sort((a, b) => b.at.localeCompare(a.at));

  const eventLabel = (key: string) => (key === MAIN_KEY ? eventName : (subEvents?.find((s) => s.id === key)?.name ?? "Sub-event"));
  const shown = showAll ? entries : entries.slice(0, PREVIEW_COUNT);

  return (
    <section className="rounded-lg border border-dash-border bg-dash-surface">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-dash-text">Recent RSVP activity</span>
        <span className="text-xs text-dash-muted">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-dash-border">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-dash-muted">Loading recent activity...</p>
          ) : isError ? (
            <p className="px-4 py-3 text-sm text-dash-danger">Recent activity could not be loaded.</p>
          ) : entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-dash-muted">No recent RSVP activity yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-dash-border">
                {shown.map((e) => {
                  const st = statusText(e.status);
                  return (
                    <li key={`${e.guest.id}-${e.eventKey}-${e.at}`}>
                      <button
                        type="button"
                        onClick={() => onEdit(e.guest)}
                        className="flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-dash-bg"
                      >
                        <span className="min-w-0">
                          <span className="block break-words text-sm text-dash-text">
                            {e.guest.name}
                            {e.isNew && <span className="ml-1.5 text-xs font-semibold text-dash-primary">New</span>}
                          </span>
                          <span className="block text-xs text-dash-muted">{eventLabel(e.eventKey)}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className={`block text-xs font-semibold ${st.className}`}>{st.label}</span>
                          <span className="block text-xs text-dash-muted">{formatWhen(e.at)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {entries.length > PREVIEW_COUNT && (
                <div className="border-t border-dash-border px-4 py-2 text-center">
                  <button type="button" onClick={() => setShowAll((prev) => !prev)} className="text-xs font-medium text-dash-primary hover:underline">
                    {showAll ? "Show fewer" : `Show all (${entries.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
