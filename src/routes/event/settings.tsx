import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingEvent, type EventRsvp, type EventMessage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Modal, Card } from "../../components/ui";
import { isValidSlug, slugify } from "../../lib/utils";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";

interface EventContextValue { event: UserEvent; eventId: string; }

export function SettingsPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<"general" | "share" | "analytics">("general");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setSlug(event.draft_slug ?? event.slug ?? "");
  }, [event]);

  const publicUrl = event.slug ? `${window.location.origin}/e/${event.slug}` : "";

  const { data: shares } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sharing_events").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests-settings", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });
  const { data: rsvps } = useQuery({
    queryKey: ["event-rsvps-settings", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("*").eq("event_id", eventId); if (error) throw error; return data as EventRsvp[]; },
  });
  const { data: messages } = useQuery({
    queryKey: ["event-messages-settings", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", eventId); if (error) throw error; return data as EventMessage[]; },
  });

  useEffect(() => {
    if (publicUrl) generateQrDataUrl(publicUrl, { width: 256 }).then(setQrUrl).catch(() => {});
  }, [publicUrl]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (slug && !isValidSlug(slug)) throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens only.");
      const { error } = await supabase.from("user_events").update({
        draft_name: name, draft_slug: slug || slugify(name),
      }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setError(null); },
    onError: (e) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); navigate("/dashboard"); },
  });

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalGuests = guests?.length ?? 0;
  const attending = rsvps?.filter((r) => r.status === "attending").length ?? 0;
  const declined = rsvps?.filter((r) => r.status === "declined").length ?? 0;
  const pending = totalGuests - attending - declined;
  const totalMessages = messages?.length ?? 0;
  const stats = [
    { label: "Total Guests", value: totalGuests },
    { label: "Attending", value: attending },
    { label: "Declined", value: declined },
    { label: "Pending", value: pending },
    { label: "Messages", value: totalMessages },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Settings</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setSettingsTab("general")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${settingsTab === "general" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>General</button>
          <button onClick={() => setSettingsTab("share")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${settingsTab === "share" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>Share</button>
          <button onClick={() => setSettingsTab("analytics")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${settingsTab === "analytics" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}>Analytics</button>
        </div>
      </div>

      {settingsTab === "general" && (
        <>
          {error && <p className="text-sm text-dash-danger">{error}</p>}
          {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
          <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
            <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" />
            <Input label="Website Link" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" />
            <p className="text-xs text-dash-muted">This is the web address guests visit: {window.location.origin}/e/{slug || "your-slug"}</p>
            <div className="pt-2"><Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button></div>
          </div>
          <div className="rounded-lg border border-dash-border border-red-200 bg-dash-surface p-4">
            <h3 className="mb-2 text-sm font-semibold text-dash-danger">Danger Zone</h3>
            <p className="mb-3 text-sm text-dash-muted">Permanently delete this event and all its data. This cannot be undone.</p>
            <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Event</Button>
          </div>
        </>
      )}

      {settingsTab === "share" && (
        <>
          {!event.is_published && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Your event is not published yet. Publish it to share with guests.</div>
          )}
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
            <h3 className="mb-2 text-sm font-semibold text-dash-text">Public Link</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={publicUrl || "Publish to get a link"} readOnly />
              <Button variant="secondary" onClick={copyLink} disabled={!publicUrl}>{copied ? "Copied!" : "Copy"}</Button>
            </div>
          </div>
          {qrUrl && (
            <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">QR Code</h3>
              <div className="flex flex-col items-center gap-3">
                <img src={qrUrl} alt="QR code" className="h-48 w-48 rounded-lg border border-dash-border" />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => downloadQrCode(publicUrl, `${event.slug || "event"}-qr.png`)}>Download PNG</Button>
                  <Button size="sm" variant="secondary" onClick={() => downloadQrSvg(publicUrl, `${event.slug || "event"}-qr.svg`)}>Download SVG</Button>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Share History</h3>
            {!shares || shares.length === 0 ? (
              <p className="text-sm text-dash-muted">No shares recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {shares.map((s) => <li key={s.id} className="text-sm text-dash-text">{s.type} — {new Date(s.created_at).toLocaleString()}</li>)}
              </ul>
            )}
          </div>
        </>
      )}

      {settingsTab === "analytics" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <Card key={s.label} className="text-center">
                <p className="text-2xl font-bold text-dash-text">{s.value}</p>
                <p className="mt-1 text-xs text-dash-muted">{s.label}</p>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">RSVP Breakdown</h3>
            <div className="space-y-2">
              {stats.slice(1, 4).map((s) => {
                const pct = totalGuests > 0 ? Math.round((s.value / totalGuests) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs text-dash-muted"><span>{s.label}</span><span>{s.value} ({pct}%)</span></div>
                    <div className="mt-1 h-2 rounded-full bg-dash-bg"><div className="h-2 rounded-full bg-dash-primary" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">Are you sure you want to permanently delete "{name}"? All guests, RSVPs, and pages will be lost.</p>
          {deleteMutation.isError && <p className="text-sm text-dash-danger">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
