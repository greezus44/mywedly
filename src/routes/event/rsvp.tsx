import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventRsvp, type EventGuest, type SubEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Badge, ColorInput, Modal } from "../../components/ui";
import { ButtonColourEditor, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { FontSelect } from "../../components/ui/FontSelect";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import type { TypographyStyle } from "../../lib/typography";
import { formatDate, isRsvpClosed } from "../../lib/utils";
import { DateTimePicker } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { RsvpPreview } from "../../components/preview/PreviewRenderers";

interface EventContextValue { event: UserEvent; eventId: string; }

type GuestStatus = "not_invited" | "pending" | "attending" | "declined";

function StatusIcon({ status }: { status: GuestStatus }) {
  if (status === "attending") return <span className="text-green-600 font-bold text-base" title="Attending">&#10003;</span>;
  if (status === "declined") return <span className="text-red-500 font-bold text-base" title="Declined">&#10007;</span>;
  if (status === "pending") return <span className="text-dash-muted font-bold text-base" title="Pending">=</span>;
  return <span className="text-dash-muted text-base" title="Not invited">&mdash;</span>;
}

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
  scheduleHeadingTypographyBm?: unknown;
  guestNameTypography?: unknown;
  additionalInfoHeading?: unknown;
  additionalInfoBody?: string;
  additionalInfoBodyTypography?: unknown;
  eventNameTypography?: unknown;
  eventDateTypography?: unknown;
  eventTimeTypography?: unknown;
  eventAddressTypography?: unknown;
  programmeItemTypography?: unknown;
  rsvpDeadlineTypography?: unknown;
  rsvpDeadlinePrefix?: string;
  contactMessage?: string;
  contactMessageTypography?: unknown;
  attendingButtonTypography?: unknown;
  declinedButtonTypography?: unknown;
}

const DEFAULT_RSVP_CONTENT: RsvpContent = {
  scheduleHeading: { text: "Program" },
  attendingText: "Attending",
  declinedText: "Decline",
  attendingColor: "#16a34a",
  declinedColor: "#dc2626",
};

function getScheduleHeadingTypography(value: unknown, fallbackText: string): TypographyStyle {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as TypographyStyle;
  return { text: typeof value === "string" ? value : fallbackText };
}

export function RsvpPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [rsvpContent, setRsvpContent] = useState<RsvpContent>(() => {
    const content = (event.draft_content ?? event.content) as Record<string, unknown> | null;
    return { ...DEFAULT_RSVP_CONTENT, ...((content?.rsvp as Partial<RsvpContent>) ?? {}) };
  });
  const [rsvpBm, setRsvpBm] = useState<Record<string, string>>(() => {
    const content = (event.draft_content ?? event.content) as Record<string, unknown> | null;
    return ((content?.rsvpBm as Record<string, string>) ?? {});
  });
  const [showEditor, setShowEditor] = useState(false);
  const [statusEditGuest, setStatusEditGuest] = useState<EventGuest | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
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

  const { data: subEvents } = useQuery({
    queryKey: ["event-sub-events-rsvp", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests-rsvp", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });
  const { data: existingInvites } = useQuery({
    queryKey: ["guest-event-invites-rsvp", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_event_invites").select("guest_id, sub_event_id, invite_type").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });
  const { data: groupAssignments } = useQuery({
    queryKey: ["group-assignments-rsvp", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_event_group_assignments").select("group_id, sub_event_id"); if (error) throw error; return data ?? []; },
  });
  const { data: allOverrides } = useQuery({
    queryKey: ["all-guest-invitation-overrides-rsvp", eventId],
    queryFn: async () => {
      if (!guests || guests.length === 0) return [];
      const { data, error } = await supabase.from("guest_invitation_overrides").select("guest_id, sub_event_id, is_invited").in("guest_id", guests.map((g) => g.id));
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!guests && guests.length > 0,
  });

  const invitedEventsByGuest = new Map<string, Set<string>>();
  if (subEvents && subEvents.length > 0) {
    for (const g of (guests ?? [])) {
      const invited = new Set<string>();
      if (g.group_id) {
        (groupAssignments ?? []).filter((a) => a.group_id === g.group_id).forEach((a) => invited.add(a.sub_event_id as string));
      }
      (existingInvites ?? []).filter((inv) => inv.guest_id === g.id && inv.invite_type === "include" && inv.sub_event_id).forEach((inv) => invited.add(inv.sub_event_id as string));
      (allOverrides ?? []).filter((o) => o.guest_id === g.id).forEach((o) => {
        const seId = o.sub_event_id as string;
        if (o.is_invited) { invited.add(seId); }
        else { invited.delete(seId); }
      });
      invitedEventsByGuest.set(g.id, invited);
    }
  }

  const rsvpStatusByGuest = new Map<string, Map<string, string>>();
  for (const r of (rsvps ?? [])) {
    let inner = rsvpStatusByGuest.get(r.guest_id);
    if (!inner) { inner = new Map(); rsvpStatusByGuest.set(r.guest_id, inner); }
    const key = r.sub_event_id ?? "__main__";
    inner.set(key, r.status);
  }

  const statusFor = (guestId: string, eventKey: string): GuestStatus => {
    if (eventKey === "__main__") {
      const g = guests?.find((gg) => gg.id === guestId);
      const s = g?.rsvp_status;
      if (s === "attending") return "attending";
      if (s === "declined") return "declined";
      if (!subEvents || subEvents.length === 0) return "pending";
      return "pending";
    }
    const invited = invitedEventsByGuest.get(guestId);
    if (!invited || !invited.has(eventKey)) return "not_invited";
    const rsvpMap = rsvpStatusByGuest.get(guestId);
    const status = rsvpMap?.get(eventKey);
    if (status === "attending") return "attending";
    if (status === "declined") return "declined";
    return "pending";
  };

  const tabLabel = (se: SubEvent) => se.tab_name?.trim() || (se.name ?? "Untitled");
  const sortedSubEvents = [...(subEvents ?? [])].sort((a, b) => {
    const aDate = a.date ?? "";
    const bDate = b.date ?? "";
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.localeCompare(bDate);
  });
  const eventColumns: Array<{ key: string; label: string }> = [];
  if (sortedSubEvents.length > 0) {
    eventColumns.push({ key: "__main__", label: "Main Event" });
  }
  for (const se of sortedSubEvents) {
    eventColumns.push({ key: se.id, label: tabLabel(se) });
  }

  const deadline = event.draft_rsvp_deadline ?? event.rsvp_deadline;
  const closed = isRsvpClosed(deadline);

  const batchUpdateStatusMutation = useMutation({
    mutationFn: async ({ guestId, drafts }: { guestId: string; drafts: Record<string, string> }) => {
      const guest = guests?.find((g) => g.id === guestId);
      const guestName = guest?.name ?? "";
      const tasks: Promise<void>[] = [];
      for (const [eventKey, status] of Object.entries(drafts)) {
        if (status === "not_invited") continue;
        if (eventKey === "__main__") {
          tasks.push((async () => { const { error } = await supabase.from("event_guests").update({ rsvp_status: status }).eq("id", guestId); if (error) throw error; })());
        } else {
          tasks.push((async () => {
            const { data: existing } = await supabase.from("event_rsvps").select("id").eq("event_id", eventId).eq("guest_id", guestId).eq("sub_event_id", eventKey).maybeSingle();
            if (existing) {
              const { error } = await supabase.from("event_rsvps").update({ status, responded_at: new Date().toISOString() }).eq("id", existing.id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, guest_id: guestId, guest_name: guestName, status, sub_event_id: eventKey, plus_ones: 0, responded_at: new Date().toISOString() });
              if (error) throw error;
            }
          })());
        }
      }
      await Promise.all(tasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests-rsvp", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvps-admin", eventId] });
      setStatusEditGuest(null);
      setStatusDrafts({});
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load RSVPs" message={error instanceof Error ? error.message : "Unknown error"} />;

  const counts = {
    attending: (guests ?? []).filter((g) => g.rsvp_status === "attending").length,
    declined: (guests ?? []).filter((g) => g.rsvp_status === "declined").length,
    pending: (guests ?? []).filter((g) => g.rsvp_status === "pending").length,
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
          <div className="space-y-2">
            <label className="block text-xs font-medium text-dash-muted">Programme Title (English)</label>
            <TypographyControls
              value={getScheduleHeadingTypography(rsvpContent.scheduleHeading, "Program")}
              onChange={(v) => setRsvpContent((p) => ({ ...p, scheduleHeading: v }))}
              showText
            />
            <Input label="Programme Title (Bahasa Melayu)" value={rsvpBm.scheduleHeading ?? ""} onChange={(e) => setRsvpBm((p) => ({ ...p, scheduleHeading: e.target.value }))} placeholder="Aturcara" />
            <TypographyControls
              label="Programme Title (Malay) Typography"
              value={getScheduleHeadingTypography(rsvpContent.scheduleHeadingTypographyBm, "")}
              onChange={(v) => setRsvpContent((p) => ({ ...p, scheduleHeadingTypographyBm: v }))}
              showText={false}
            />
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-dash-muted">Attending Button Font</label>
              <FontSelect
                value={(rsvpContent.attendingButtonTypography as TypographyStyle | undefined)?.fontFamily ?? ""}
                onChange={(fontFamily) => setRsvpContent((p) => ({ ...p, attendingButtonTypography: { ...((p.attendingButtonTypography as TypographyStyle | undefined) ?? {}), fontFamily } }))}
                options={HEADING_FONT_OPTIONS}
                placeholder="Use theme button font"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-dash-muted">Declined Button Font</label>
              <FontSelect
                value={(rsvpContent.declinedButtonTypography as TypographyStyle | undefined)?.fontFamily ?? ""}
                onChange={(fontFamily) => setRsvpContent((p) => ({ ...p, declinedButtonTypography: { ...((p.declinedButtonTypography as TypographyStyle | undefined) ?? {}), fontFamily } }))}
                options={HEADING_FONT_OPTIONS}
                placeholder="Use theme button font"
              />
            </div>
          </div>
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
            <label className="block text-xs font-medium text-dash-muted">Event Date Font Family</label>
            <FontSelect
              value={(rsvpContent.eventDateTypography as TypographyStyle | undefined)?.fontFamily ?? ""}
              onChange={(fontFamily) => setRsvpContent((p) => ({ ...p, eventDateTypography: { ...((p.eventDateTypography as TypographyStyle | undefined) ?? {}), fontFamily } }))}
              options={HEADING_FONT_OPTIONS}
              placeholder="Use date's default font"
            />
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
        preview={<RsvpPreview theme={event.draft_theme ?? event.theme} content={rsvpContent as unknown as Record<string, unknown>} eventDate={event.draft_event_date ?? event.event_date} subEventDates={(subEvents ?? []).map((subEvent) => subEvent.date)} />}
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
      {!guests || guests.length === 0 ? (
        <EmptyState title="No guests" description="Add guests from the Guests page to see their RSVP status here." />
      ) : (
        <>
        <div className="text-xs text-dash-muted">
          <span className="text-green-600 font-bold">&#10003;</span> Attending &nbsp; <span className="text-red-500 font-bold">&#10007;</span> Declined &nbsp; <span className="font-bold">=</span> Pending &nbsp; <span>&mdash;</span> Not invited
        </div>
        <div className="overflow-x-auto rounded-lg border border-dash-border">
          <table className="w-full">
            <thead className="bg-dash-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Guest</th>
                {eventColumns.length > 0 ? (
                  eventColumns.map((col) => (
                    <th key={col.key} className="px-4 py-2 text-center text-xs font-medium text-dash-muted whitespace-nowrap">{col.label}</th>
                  ))
                ) : (
                  <th className="px-4 py-2 text-center text-xs font-medium text-dash-muted">Status</th>
                )}
                <th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Change Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {guests.map((g) => {
                return (
                  <tr key={g.id}>
                    <td className="px-4 py-2 text-sm text-dash-text">{g.name}</td>
                    {eventColumns.length > 0 ? (
                      eventColumns.map((col) => (
                        <td key={col.key} className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, col.key)} /></td>
                      ))
                    ) : (
                      <td className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, "__main__")} /></td>
                    )}
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => {
                          const drafts: Record<string, string> = {};
                          if (eventColumns.length > 0) {
                            for (const col of eventColumns) {
                              const s = statusFor(g.id, col.key);
                              drafts[col.key] = s === "not_invited" ? "not_invited" : s;
                            }
                          } else {
                            drafts["__main__"] = g.rsvp_status ?? "pending";
                          }
                          setStatusDrafts(drafts);
                          setStatusEditGuest(g);
                        }}
                        className="text-xs text-dash-primary hover:underline"
                      >Change Status</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Modal open={!!statusEditGuest} onClose={() => { setStatusEditGuest(null); setStatusDrafts({}); }} title={statusEditGuest?.name ?? "Change Status"}>
        <div className="space-y-4">
          {batchUpdateStatusMutation.isError && <p className="text-sm text-dash-danger">{batchUpdateStatusMutation.error instanceof Error ? batchUpdateStatusMutation.error.message : "Failed to save"}</p>}
          <div className="space-y-3">
            {(eventColumns.length > 0 ? eventColumns : [{ key: "__main__", label: "Status" }]).map((col) => {
              const currentDraft = statusDrafts[col.key] ?? "pending";
              const isNotInvited = currentDraft === "not_invited";
              return (
                <div key={col.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-dash-text">{col.label}</span>
                  <select
                    value={currentDraft}
                    disabled={isNotInvited}
                    onChange={(e) => setStatusDrafts((p) => ({ ...p, [col.key]: e.target.value }))}
                    className="rounded border border-dash-border bg-dash-bg px-2 py-1 text-xs text-dash-text"
                  >
                    {isNotInvited && <option value="not_invited" disabled>Not invited</option>}
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 border-t border-dash-border pt-3">
            <Button size="sm" variant="secondary" onClick={() => { setStatusEditGuest(null); setStatusDrafts({}); }}>Cancel</Button>
            <Button size="sm" onClick={() => batchUpdateStatusMutation.mutate({ guestId: statusEditGuest!.id, drafts: statusDrafts })} loading={batchUpdateStatusMutation.isPending}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
