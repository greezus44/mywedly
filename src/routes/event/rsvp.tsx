import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Badge, ColorInput } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { formatDate, formatDateTime, isRsvpClosed } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export interface RsvpContent {
  title?: string;
  subtitle?: string;
  attendingText?: string;
  declinedText?: string;
  attendingMessage?: string;
  declinedMessage?: string;
  attendingColor?: string;
  declinedColor?: string;
}

const DEFAULT_RSVP_CONTENT: RsvpContent = {
  title: "RSVP",
  subtitle: "Let us know if you'll be joining us",
  attendingText: "Attending",
  declinedText: "Declined",
  attendingMessage: "Thank you! We look forward to seeing you.",
  declinedMessage: "We're sorry you can't make it. Thank you for letting us know.",
  attendingColor: "#16a34a",
  declinedColor: "#dc2626",
};

export function RsvpPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [rsvpContent, setRsvpContent] = useState<RsvpContent>(() => {
    const content = (event.draft_content ?? event.content) as Record<string, unknown> | null;
    return { ...DEFAULT_RSVP_CONTENT, ...((content?.rsvp as Partial<RsvpContent>) ?? {}) };
  });
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const content = (event.draft_content ?? event.content) as Record<string, unknown> | null;
    setRsvpContent({ ...DEFAULT_RSVP_CONTENT, ...((content?.rsvp as Partial<RsvpContent>) ?? {}) });
  }, [event.draft_content, event.content]);

  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const existing = ((event.draft_content ?? event.content) as Record<string, unknown> | null) ?? {};
      const updated = { ...existing, rsvp: rsvpContent };
      const { error } = await supabase.from("user_events").update({ draft_content: updated as unknown as Json }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  const { data: rsvps, isLoading, isError, error } = useQuery({
    queryKey: ["event-rsvps-admin", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId).order("responded_at", { ascending: false });
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const deadline = event.draft_rsvp_deadline ?? event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  const filtered = (rsvps ?? []).filter((r) => filter === "all" || r.status === filter);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("event_rsvps").update({ status, responded_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-rsvps-admin", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load RSVPs" message={error instanceof Error ? error.message : "Unknown error"} />;

  const counts = {
    attending: (rsvps ?? []).filter((r) => r.status === "attending").length,
    declined: (rsvps ?? []).filter((r) => r.status === "declined").length,
    pending: (rsvps ?? []).filter((r) => r.status === "pending").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">RSVP</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowEditor((v) => !v)}>{showEditor ? "Hide Editor" : "Edit RSVP Page"}</Button>
          {deadline && <Badge variant={closed ? "danger" : "warning"}>{closed ? "Closed" : `Closes ${formatDate(deadline)}`}</Badge>}
        </div>
      </div>
      {showEditor && (
        <div className="space-y-3 rounded-lg border border-dash-border bg-dash-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dash-text">RSVP Page Content</h3>
            <Button size="sm" onClick={() => saveContentMutation.mutate()} loading={saveContentMutation.isPending}>Save</Button>
          </div>
          {saveContentMutation.isError && <p className="text-sm text-dash-danger">{saveContentMutation.error instanceof Error ? saveContentMutation.error.message : "Save failed"}</p>}
          {saveContentMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
          <Input label="Page Title" value={rsvpContent.title ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, title: e.target.value }))} />
          <Input label="Subtitle" value={rsvpContent.subtitle ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, subtitle: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Attending Button Text" value={rsvpContent.attendingText ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, attendingText: e.target.value }))} />
            <Input label="Declined Button Text" value={rsvpContent.declinedText ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, declinedText: e.target.value }))} />
          </div>
          <Textarea label="Attending Confirmation Message" value={rsvpContent.attendingMessage ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, attendingMessage: e.target.value }))} rows={2} />
          <Textarea label="Declined Confirmation Message" value={rsvpContent.declinedMessage ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, declinedMessage: e.target.value }))} rows={2} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Attending Selected Colour</label>
              <ColorInput value={rsvpContent.attendingColor ?? "#16a34a"} onChange={(v) => setRsvpContent((p) => ({ ...p, attendingColor: v }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Declined Selected Colour</label>
              <ColorInput value={rsvpContent.declinedColor ?? "#dc2626"} onChange={(v) => setRsvpContent((p) => ({ ...p, declinedColor: v }))} />
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-dash-border bg-dash-surface p-3 text-center"><p className="text-xl font-bold text-green-600">{counts.attending}</p><p className="text-xs text-dash-muted">Attending</p></div>
        <div className="rounded-lg border border-dash-border bg-dash-surface p-3 text-center"><p className="text-xl font-bold text-red-600">{counts.declined}</p><p className="text-xs text-dash-muted">Declined</p></div>
        <div className="rounded-lg border border-dash-border bg-dash-surface p-3 text-center"><p className="text-xl font-bold text-gray-600">{counts.pending}</p><p className="text-xs text-dash-muted">Pending</p></div>
      </div>
      <div className="flex gap-2">
        {["all", "attending", "declined", "pending"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${filter === f ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>{f}</button>
        ))}
      </div>
      {!filtered || filtered.length === 0 ? (
        <EmptyState title="No RSVPs" description="No responses match this filter." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-dash-border">
          <table className="w-full">
            <thead className="bg-dash-bg"><tr><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Guest</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Status</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Plus Ones</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Message</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Responded</th><th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th></tr></thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-dash-text">{r.guest_name ?? "—"}</td>
                  <td className="px-4 py-2"><Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "danger" : "default"}>{r.status}</Badge></td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{r.plus_ones}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted max-w-xs truncate">{r.message ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-dash-muted">{r.responded_at ? formatDateTime(r.responded_at) : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <select value={r.status} onChange={(e) => updateMutation.mutate({ id: r.id, status: e.target.value })} className="rounded border border-dash-border bg-dash-bg px-2 py-1 text-xs text-dash-text">
                      <option value="pending">Pending</option><option value="attending">Attending</option><option value="declined">Declined</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
