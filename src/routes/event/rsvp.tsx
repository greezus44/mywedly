import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Badge, ColorInput } from "../../components/ui";
import { ButtonColourEditor, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { formatDate, formatDateTime, isRsvpClosed } from "../../lib/utils";
import { DateTimePicker } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";

interface EventContextValue { event: UserEvent; eventId: string; }

export interface RsvpContent {
  title?: string;
  titleTypography?: unknown;
  subtitle?: string;
  subtitleTypography?: unknown;
  attendingText?: string;
  declinedText?: string;
  attendingMessage?: string;
  declinedMessage?: string;
  attendingColor?: string;
  declinedColor?: string;
  attendingButtonColors?: ButtonColors;
  declinedButtonColors?: ButtonColors;
  attendingSelectedButtonColors?: ButtonColors;
  declinedSelectedButtonColors?: ButtonColors;
  scheduleHeading?: unknown;
  guestNameTypography?: unknown;
  additionalInfoHeading?: unknown;
  additionalInfoBody?: string;
  additionalInfoBodyTypography?: unknown;
  eventNameTypography?: unknown;
  eventTimeTypography?: unknown;
  eventAddressTypography?: unknown;
  programmeItemTypography?: unknown;
  rsvpDeadlineTypography?: unknown;
  rsvpDeadlinePrefix?: string;
  plusOneYesButtonColors?: ButtonColors;
  plusOneNoButtonColors?: ButtonColors;
  plusOneYesSelectedButtonColors?: ButtonColors;
  plusOneNoSelectedButtonColors?: ButtonColors;
  contactMessage?: string;
  contactMessageTypography?: unknown;
}

const DEFAULT_RSVP_CONTENT: RsvpContent = {
  attendingText: "Attending",
  declinedText: "Decline",
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
  const [rsvpBm, setRsvpBm] = useState<Record<string, string>>(() => {
    const content = (event.draft_content ?? event.content) as Record<string, unknown> | null;
    return ((content?.rsvpBm as Record<string, string>) ?? {});
  });
  const [showEditor, setShowEditor] = useState(false);
  const [rsvpDeadline, setRsvpDeadline] = useState(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "");
  useEffect(() => { setRsvpDeadline(event.draft_rsvp_deadline ?? event.rsvp_deadline ?? ""); }, [event.draft_rsvp_deadline, event.rsvp_deadline]);

  const saveDeadlineMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("user_events").update({ draft_rsvp_deadline: rsvpDeadline || null }).eq("id", eventId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  useEffect(() => {
    const content = (event.draft_content ?? event.content) as Record<string, unknown> | null;
    setRsvpContent({ ...DEFAULT_RSVP_CONTENT, ...((content?.rsvp as Partial<RsvpContent>) ?? {}) });
    setRsvpBm(((content?.rsvpBm as Record<string, string>) ?? {}));
  }, [event.draft_content, event.content]);

  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const existing = ((event.draft_content ?? event.content) as Record<string, unknown> | null) ?? {};
      const updated = { ...existing, rsvp: rsvpContent, rsvpBm };
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
      <SplitEditor
        editor={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dash-text">RSVP Page Content</h3>
            <Button size="sm" onClick={() => saveContentMutation.mutate()} loading={saveContentMutation.isPending}>Save</Button>
          </div>
          {saveContentMutation.isError && <p className="text-sm text-dash-danger">{saveContentMutation.error instanceof Error ? saveContentMutation.error.message : "Save failed"}</p>}
          {saveContentMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
          <Input label="Page Title" value={rsvpContent.title ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, title: e.target.value }))} />
          <Input label="Page Title (Bahasa Melayu)" value={rsvpBm.title ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, title: e.target.value }))} placeholder="Auto-translate if empty" />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Title Typography</label>
            <TypographyControls value={rsvpContent.titleTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, titleTypography: v }))} showText={false} />
          </div>
          <Input label="Subtitle" value={rsvpContent.subtitle ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, subtitle: e.target.value }))} />
          <Input label="Subtitle (Bahasa Melayu)" value={rsvpBm.subtitle ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, subtitle: e.target.value }))} placeholder="Auto-translate if empty" />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Subtitle Typography</label>
            <TypographyControls value={rsvpContent.subtitleTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, subtitleTypography: v }))} showText={false} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Attending Button Text" value={rsvpContent.attendingText ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, attendingText: e.target.value }))} />
            <Input label="Declined Button Text" value={rsvpContent.declinedText ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, declinedText: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Attending Text (BM)" value={rsvpBm.attendingText ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, attendingText: e.target.value }))} placeholder="Auto-translate" />
            <Input label="Declined Text (BM)" value={rsvpBm.declinedText ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, declinedText: e.target.value }))} placeholder="Auto-translate" />
          </div>
          <Textarea label="Attending Confirmation Message" value={rsvpContent.attendingMessage ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, attendingMessage: e.target.value }))} rows={2} />
          <Textarea label="Attending Message (BM)" value={rsvpBm.attendingMessage ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, attendingMessage: e.target.value }))} rows={2} placeholder="Auto-translate if empty" />
          <Textarea label="Declined Confirmation Message" value={rsvpContent.declinedMessage ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, declinedMessage: e.target.value }))} rows={2} />
          <Textarea label="Declined Message (BM)" value={rsvpBm.declinedMessage ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, declinedMessage: e.target.value }))} rows={2} placeholder="Auto-translate if empty" />
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
          <ButtonColourEditor label="Attending Button Colours" value={rsvpContent.attendingButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, attendingButtonColors: v }))} />
          <ButtonColourEditor label="Attending Selected Button Colours" value={rsvpContent.attendingSelectedButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, attendingSelectedButtonColors: v }))} />
          <ButtonColourEditor label="Declined Button Colours" value={rsvpContent.declinedButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, declinedButtonColors: v }))} />
          <ButtonColourEditor label="Declined Selected Button Colours" value={rsvpContent.declinedSelectedButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, declinedSelectedButtonColors: v }))} />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Guest Name Typography</label>
            <TypographyControls value={rsvpContent.guestNameTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, guestNameTypography: v }))} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Additional Information Heading</label>
            <TypographyControls value={rsvpContent.additionalInfoHeading ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, additionalInfoHeading: v }))} />
          </div>
          <Textarea label="Additional Information Content" value={rsvpContent.additionalInfoBody ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, additionalInfoBody: e.target.value }))} rows={3} />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Additional Info Content Typography</label>
            <TypographyControls value={rsvpContent.additionalInfoBodyTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, additionalInfoBodyTypography: v }))} showText={false} />
          </div>
          <div className="space-y-2 border-t border-dash-border pt-3">
            <label className="block text-xs font-semibold text-dash-text">Event Details Typography</label>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Event Name Typography</label>
            <TypographyControls value={rsvpContent.eventNameTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, eventNameTypography: v }))} showText={false} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Event Time Typography</label>
            <TypographyControls value={rsvpContent.eventTimeTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, eventTimeTypography: v }))} showText={false} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Event Address Typography</label>
            <TypographyControls value={rsvpContent.eventAddressTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, eventAddressTypography: v }))} showText={false} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Programme Item Typography</label>
            <TypographyControls value={rsvpContent.programmeItemTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, programmeItemTypography: v }))} showText={false} />
          </div>
          <div className="space-y-2 border-t border-dash-border pt-3">
            <label className="block text-xs font-semibold text-dash-text">+1 Button Colours</label>
          </div>
          <ButtonColourEditor label="+1 Yes Button Colours" value={rsvpContent.plusOneYesButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, plusOneYesButtonColors: v }))} />
          <ButtonColourEditor label="+1 Yes Selected Button Colours" value={rsvpContent.plusOneYesSelectedButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, plusOneYesSelectedButtonColors: v }))} />
          <ButtonColourEditor label="+1 No Button Colours" value={rsvpContent.plusOneNoButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, plusOneNoButtonColors: v }))} />
          <ButtonColourEditor label="+1 No Selected Button Colours" value={rsvpContent.plusOneNoSelectedButtonColors ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, plusOneNoSelectedButtonColors: v }))} />
          <Input label="RSVP Deadline Prefix Text" value={rsvpContent.rsvpDeadlinePrefix ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, rsvpDeadlinePrefix: e.target.value }))} placeholder="e.g. Please RSVP before, Kindly respond before" />
          <Input label="Deadline Prefix (BM)" value={rsvpBm.rsvpDeadlinePrefix ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, rsvpDeadlinePrefix: e.target.value }))} placeholder="Auto-translate if empty" />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">RSVP Deadline Typography</label>
            <TypographyControls value={rsvpContent.rsvpDeadlineTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, rsvpDeadlineTypography: v }))} showText={false} />
          </div>
          <div className="space-y-2 border-t border-dash-border pt-3">
            <label className="block text-xs font-semibold text-dash-text">Contact Information</label>
          </div>
          <Textarea label="Contact Message" value={rsvpContent.contactMessage ?? ""} onChange={(e) => setRsvpContent((p) => ({ ...p, contactMessage: e.target.value }))} rows={2} placeholder="e.g. Please contact Sarah at +673 123 4567 if you have any questions." />
          <Textarea label="Contact Message (BM)" value={rsvpBm.contactMessage ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, contactMessage: e.target.value }))} rows={2} placeholder="Auto-translate if empty" />
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Contact Message Typography</label>
            <TypographyControls value={rsvpContent.contactMessageTypography ?? {}} onChange={(v) => setRsvpContent((p) => ({ ...p, contactMessageTypography: v }))} showText={false} />
          </div>
        </div>
        }
        preview={<RsvpPreview theme={event.draft_theme ?? event.theme} content={rsvpContent as unknown as Record<string, unknown>} />}
      />
      )}
      <div className="space-y-3 rounded-lg border border-dash-border bg-dash-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">RSVP Deadline</h3>
          <Button size="sm" onClick={() => saveDeadlineMutation.mutate()} loading={saveDeadlineMutation.isPending}>Save Deadline</Button>
        </div>
        {saveDeadlineMutation.isError && <p className="text-sm text-dash-danger">{saveDeadlineMutation.error instanceof Error ? saveDeadlineMutation.error.message : "Save failed"}</p>}
        {saveDeadlineMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
        <DateTimePicker label="RSVP Deadline" value={rsvpDeadline} onChange={setRsvpDeadline} />
        <p className="text-xs text-dash-muted">Guests won't be able to RSVP after this date. Leave blank for no deadline.</p>
      </div>
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
            <thead className="bg-dash-bg"><tr><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Guest</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Status</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Plus Ones</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">+1 Name</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Message</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Responded</th><th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th></tr></thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-dash-text">{r.guest_name ?? "—"}</td>
                  <td className="px-4 py-2"><Badge variant={r.status === "attending" ? "success" : r.status === "declined" ? "danger" : "default"}>{r.status}</Badge></td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{r.plus_ones}</td>
                  <td className="px-4 py-2 text-sm text-dash-text">{r.plus_one_names?.[0] ?? ""}</td>
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
