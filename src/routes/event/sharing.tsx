import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingEvent, type SubEvent, type OpenRsvpLink, type GuestGroup, type Json } from "../../lib/supabase";
import { Button, Input, Toggle, Modal, LoadingSpinner, Badge, DateTimePicker, ColorInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ButtonColourEditor, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { CollapsibleGroup } from "../../components/ui/CollapsibleGroup";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { publicSiteUrl } from "../../lib/site-url";
import { useEffect } from "react";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

interface PageConfig {
  heading?: string;
  headingBm?: string;
  intro?: string;
  introBm?: string;
  nameLabel?: string;
  nameLabelBm?: string;
  attendingLabel?: string;
  attendingLabelBm?: string;
  decliningLabel?: string;
  decliningLabelBm?: string;
  submitLabel?: string;
  submitLabelBm?: string;
  thankYouAttending?: string;
  thankYouAttendingBm?: string;
  thankYouDeclined?: string;
  thankYouDeclinedBm?: string;
  namePlaceholder?: string;
  namePlaceholderBm?: string;
  scheduleHeading?: string;
  scheduleHeadingBm?: string;
  attendingColor?: string;
  declinedColor?: string;
  buttonColors?: ButtonColors;
  attendingColors?: ButtonColors;
  declinedColors?: ButtonColors;
  plusOneYesColors?: ButtonColors;
  plusOneNoColors?: ButtonColors;
  plusOneQuestion?: string;
  plusOneQuestionBm?: string;
  phoneEnabled?: boolean;
  phoneQuestion?: string;
  phoneQuestionBm?: string;
  phoneHelper?: string;
  phoneHelperBm?: string;
  phoneExample?: string;
  phoneExampleBm?: string;
  phoneExampleColor?: string;
  plusOneYesLabel?: string;
  plusOneYesLabelBm?: string;
  plusOneNoLabel?: string;
  plusOneNoLabelBm?: string;
  nameWeight?: number;
  attendingWeight?: number;
  decliningWeight?: number;
  submitWeight?: number;
  plusOneYesWeight?: number;
  plusOneNoWeight?: number;
  nameColor?: string;
  attendingTextColor?: string;
  decliningTextColor?: string;
  submitTextColor?: string;
  plusOneYesTextColor?: string;
  plusOneNoTextColor?: string;
  plusOneQuestionColor?: string;
  headingTypography?: TypographyStyle;
  introTypography?: TypographyStyle;
  eventTitleTypography?: TypographyStyle;
  eventTimeTypography?: TypographyStyle;
  eventAddressTypography?: TypographyStyle;
  scheduleHeadingTypography?: TypographyStyle;
  programmeItemTypography?: TypographyStyle;
  rsvpDeadlineTypography?: TypographyStyle;
  nameLabelTypography?: TypographyStyle;
  nameInputTypography?: TypographyStyle;
  attendingTypography?: TypographyStyle;
  declinedTypography?: TypographyStyle;
  plusOneQuestionTypography?: TypographyStyle;
  plusOneYesTypography?: TypographyStyle;
  plusOneNoTypography?: TypographyStyle;
  phoneQuestionTypography?: TypographyStyle;
  phoneHelperTypography?: TypographyStyle;
  submitTypography?: TypographyStyle;
  logoUrl?: string;
  logoSize?: number;
}

const DEFAULT_PAGE_CONFIG: PageConfig = {
  heading: "RSVP",
  headingBm: "RSVP",
  intro: "Please let us know if you can make it.",
  introBm: "Sila beritahu kami sama ada anda boleh hadir.",
  nameLabel: "Your Name",
  nameLabelBm: "Nama Anda",
  namePlaceholder: "Enter your full name",
  namePlaceholderBm: "Masukkan nama penuh anda",
  attendingLabel: "Attending",
  attendingLabelBm: "Hadir",
  decliningLabel: "Declined",
  decliningLabelBm: "Tidak Hadir",
  submitLabel: "Submit RSVP",
  submitLabelBm: "Hantar RSVP",
  scheduleHeading: "Program",
  scheduleHeadingBm: "Aturcara",
  thankYouAttending: "Thank you! We look forward to seeing you.",
  thankYouAttendingBm: "Terima kasih! Kami menanti kehadiran anda.",
  thankYouDeclined: "Thank you for letting us know.",
  thankYouDeclinedBm: "Terima kasih kerana memberitahu kami.",
  attendingColor: "#16a34a",
  declinedColor: "#dc2626",
  plusOneQuestion: "Bringing a +1?",
  plusOneQuestionBm: "Membawa +1?",
  phoneEnabled: false,
  phoneQuestion: "Your phone number (optional)",
  phoneQuestionBm: "Nombor telefon (pilihan)",
  phoneHelper: "For seating arrangements",
  phoneHelperBm: "Untuk pengaturan tempat duduk",
  phoneExample: "+60 12-345 6789",
  phoneExampleBm: "+60 12-345 6789",
  plusOneYesLabel: "Yes",
  plusOneYesLabelBm: "Ya",
  plusOneNoLabel: "No",
  plusOneNoLabelBm: "Tidak",
};

export function SharingPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [editingLink, setEditingLink] = useState<OpenRsvpLink | null>(null);
  const [editConfig, setEditConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG);
  const [editEnabled, setEditEnabled] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editToken, setEditToken] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenChecking, setTokenChecking] = useState(false);
  const [editRsvpDeadline, setEditRsvpDeadline] = useState("");
  const [creatingForSubEvent, setCreatingForSubEvent] = useState<string | null>(null);
  const [newLinkGroupName, setNewLinkGroupName] = useState("");
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

  const publicUrl = event.slug ? publicSiteUrl(`/e/${event.slug}`) : "";

  const { data: shares } = useQuery({
    queryKey: ["sharing-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sharing_events").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as SharingEvent[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: openLinks } = useQuery({
    queryKey: ["open-rsvp-links", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("open_rsvp_links").select("*").eq("event_id", eventId);
      if (error) throw error;
      return (data ?? []) as OpenRsvpLink[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  useEffect(() => {
    if (publicUrl) generateQrDataUrl(publicUrl, { width: 256 }).then(setQrUrl).catch(() => {});
  }, [publicUrl]);

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linksForSubEvent = (subEventId: string) =>
    (openLinks ?? []).filter((l) => l.sub_event_id === subEventId)
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const groupNameFor = (id: string | null) => (id ? (groups ?? []).find((g) => g.id === id)?.name ?? null : null);
  const defaultGroup = (groups ?? []).find((g) => g.is_open_rsvp_default) ?? null;
  const primaryLink = (openLinks ?? []).find((l) => l.is_primary) ?? null;

  const computeGroupName = (groupId: string | null) => {
    if (groupId) return (groups ?? []).find((g) => g.id === groupId)?.name ?? "";
    return defaultGroup?.name ?? "Open Link RSVP";
  };

  const createLink = useMutation({
    mutationFn: async ({ subEventId, groupName }: { subEventId: string; groupName: string }) => {
      let groupId: string | null = null;
      const trimmedName = groupName.trim();
      if (trimmedName) {
        const { data: existing } = await supabase
          .from("guest_groups")
          .select("id")
          .eq("event_id", eventId)
          .eq("name", trimmedName)
          .maybeSingle();
        if (existing) {
          groupId = existing.id;
        } else {
          const { data: newGroup, error: groupError } = await supabase
            .from("guest_groups")
            .insert({ event_id: eventId, name: trimmedName, sort_order: 9999 })
            .select("id")
            .single();
          if (groupError) throw groupError;
          groupId = newGroup.id;
        }
      }
      // First link for the event becomes the primary (style source). Extra links
      // inherit the primary link's page_config so all links share one look.
      const hasPrimary = (openLinks ?? []).some((l) => l.is_primary);
      const seedConfig = primaryLink ? (primaryLink.page_config ?? DEFAULT_PAGE_CONFIG) : DEFAULT_PAGE_CONFIG;
      const { data, error } = await supabase
        .from("open_rsvp_links")
        .insert({ event_id: eventId, sub_event_id: subEventId, allow_plus_one: true, is_enabled: true, page_config: seedConfig as unknown as Json, group_id: groupId, is_primary: !hasPrimary })
        .select("*")
        .single();
      if (error) throw error;
      return data as OpenRsvpLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setCreatingForSubEvent(null);
      setNewLinkGroupName("");
    },
  });

  const toggleLink = useMutation({
    mutationFn: async ({ link, enabled }: { link: OpenRsvpLink; enabled: boolean }) => {
      const { error } = await supabase.from("open_rsvp_links").update({ is_enabled: enabled }).eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] }),
  });

  const deleteLink = useMutation({
    mutationFn: async (link: OpenRsvpLink) => {
      const { error } = await supabase.from("open_rsvp_links").delete().eq("id", link.id);
      if (error) throw error;
      // If we deleted the primary link, promote the oldest remaining link.
      if (link.is_primary) {
        const { data: remaining } = await supabase
          .from("open_rsvp_links")
          .select("id")
          .eq("event_id", eventId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (remaining) {
          await supabase.from("open_rsvp_links").update({ is_primary: true }).eq("id", remaining.id);
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] }),
  });

  const openEditor = (link: OpenRsvpLink) => {
    setEditingLink(link);
    setEditConfig({ ...DEFAULT_PAGE_CONFIG, ...((link.page_config ?? {}) as PageConfig) });
    setEditEnabled(link.is_enabled);
    setEditToken(link.token);
    setEditGroupId(link.group_id);
    setEditGroupName(computeGroupName(link.group_id));
    setTokenError(null);
    const se = (subEvents ?? []).find((s) => s.id === link.sub_event_id);
    setEditRsvpDeadline(se?.rsvp_deadline ?? "");
  };

  const joinPrefix = publicSiteUrl("/rsvp/");

  const validateToken = async (token: string): Promise<string | null> => {
    const trimmed = token.trim();
    if (trimmed.length < 3) return "Link ending must be at least 3 characters.";
    if (trimmed.length > 60) return "Link ending must be 60 characters or fewer.";
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) return "Use only letters, numbers, and hyphens.";
    if (trimmed === editingLink?.token) return null;
    setTokenChecking(true);
    try {
      const { data, error } = await supabase.from("open_rsvp_links").select("id").eq("token", trimmed).maybeSingle();
      if (error) return "Could not verify the link ending. Please try again.";
      if (data) return "This link ending is already in use. Please choose another.";
      return null;
    } finally {
      setTokenChecking(false);
    }
  };

  const saveEdit = async () => {
    if (!editingLink) return;
    const trimmedToken = editToken.trim();
    let tokenToSave: string | null = null;
    if (trimmedToken !== editingLink.token) {
      const tokenErr = await validateToken(trimmedToken);
      if (tokenErr) {
        setTokenError(tokenErr);
        return;
      }
      tokenToSave = trimmedToken;
    } else {
      setTokenError(null);
    }
    setSavingEdit(true);
    const trimmedGroupName = editGroupName.trim();

    // Handle group rename / creation before saving the link.
    let groupIdToSave = editGroupId;
    if (trimmedGroupName) {
      if (groupIdToSave) {
        // Rename existing group if the name changed.
        const currentName = (groups ?? []).find((g) => g.id === groupIdToSave)?.name;
        if (currentName !== trimmedGroupName) {
          await supabase.from("guest_groups").update({ name: trimmedGroupName }).eq("id", groupIdToSave);
        }
      } else {
        // "Default" selected: rename the existing default group if there is one.
        if (defaultGroup) {
          if (defaultGroup.name !== trimmedGroupName) {
            await supabase.from("guest_groups").update({ name: trimmedGroupName }).eq("id", defaultGroup.id);
          }
          groupIdToSave = null; // keep link on default (group_id stays null, RPC finds by flag)
        } else {
          // No default group exists yet — create one with the flag and assign it to the link.
          const { data: newDefault, error: createErr } = await supabase
            .from("guest_groups")
            .insert({ event_id: eventId, name: trimmedGroupName, sort_order: 9999, is_open_rsvp_default: true })
            .select("id")
            .single();
          if (createErr) {
            setSavingEdit(false);
            return;
          }
          groupIdToSave = newDefault.id;
        }
      }
    }

    const isPrimary = editingLink.is_primary;
    const updates: Record<string, unknown> = { is_enabled: editEnabled, group_id: groupIdToSave };
    if (isPrimary) updates.page_config = editConfig as unknown as Json;
    if (tokenToSave) updates.token = tokenToSave;
    const { error } = await supabase
      .from("open_rsvp_links")
      .update(updates)
      .eq("id", editingLink.id);
    if (error) {
      if (error.code === "23505") {
        setTokenError("This link ending is already in use. Please choose another.");
      } else {
        setTokenError("Could not save the link ending. Please try again.");
      }
      setSavingEdit(false);
      return;
    }
    // Primary link governs the shared page style: push its config + plus-one
    // setting to every other link so all Open RSVP pages look identical.
    if (isPrimary) {
      await supabase
        .from("open_rsvp_links")
        .update({ page_config: editConfig as unknown as Json, allow_plus_one: true })
        .eq("event_id", eventId)
        .neq("id", editingLink.id);
    }
    const subEventDeadline = editRsvpDeadline || null;
    const currentSub = (subEvents ?? []).find((s) => s.id === editingLink.sub_event_id);
    if (currentSub && (currentSub.rsvp_deadline ?? null) !== subEventDeadline) {
      await supabase.from("sub_events").update({ rsvp_deadline: subEventDeadline }).eq("id", editingLink.sub_event_id);
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
    }
    queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] });
    queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    setSavingEdit(false);
    setEditingLink(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Open RSVP</h2>
      {!event.is_published && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Your event is not published yet. Publish it to share with guests.</div>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-dash-text">Public Link</h3>
        <div className="flex gap-2">
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
        <h3 className="mb-1 text-sm font-semibold text-dash-text">Open RSVP Links</h3>
        <p className="mb-4 text-sm text-dash-muted">Create one or more links for each event. Each link can route guests into their own group on your guest list — for example, one link for the groom's side and one for the bride's side. Guests fill in their name and RSVP yes or no.</p>
        {(!subEvents || subEvents.length === 0) ? (
          <p className="text-sm text-dash-muted">No events found. Create events first in the Events tab.</p>
        ) : (
          <div className="space-y-4">
            {subEvents.map((se) => {
              const seLinks = linksForSubEvent(se.id);
              return (
                <div key={se.id} className="rounded-lg border border-dash-border bg-dash-bg p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-dash-text">{se.name}</span>
                    <span className="text-xs text-dash-muted">({seLinks.length} link{seLinks.length === 1 ? "" : "s"})</span>
                  </div>
                  {seLinks.length > 0 && (
                    <div className="space-y-3">
                      {seLinks.map((link) => {
                        const joinUrl = publicSiteUrl(`/rsvp/${link.token}`);
                        const gName = groupNameFor(link.group_id);
                        return (
                          <div key={link.id} className="rounded-md border border-dash-border bg-dash-surface p-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={link.is_enabled ? "success" : "default"}>{link.is_enabled ? "Enabled" : "Disabled"}</Badge>
                                {link.is_primary && <Badge variant="default">Primary</Badge>}
                                {gName && <span className="text-xs text-dash-muted">Group: {gName}</span>}
                                {!gName && <span className="text-xs text-dash-muted">Default group</span>}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => openEditor(link)}>Edit</Button>
                                <Button size="sm" variant="secondary" onClick={() => toggleLink.mutate({ link, enabled: !link.is_enabled })}>{link.is_enabled ? "Disable" : "Enable"}</Button>
                                <Button size="sm" variant="danger" onClick={() => { if (confirm("Delete this open RSVP link? Guests who already registered will remain on your list.")) deleteLink.mutate(link); }}>Delete</Button>
                              </div>
                            </div>
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-2">
                                <Input value={joinUrl} readOnly />
                                <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(joinUrl); }}>Copy</Button>
                              </div>
                              <OpenLinkQr url={joinUrl} slug={gName || se.name} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {creatingForSubEvent === se.id ? (
                    <div className="mt-3 rounded-md border border-dash-border bg-dash-surface p-3">
                      <label className="mb-1 block text-xs font-medium text-dash-muted">Group name (optional)</label>
                      <div className="flex gap-2">
                        <Input value={newLinkGroupName} onChange={(e) => setNewLinkGroupName(e.target.value)} placeholder="e.g. Groom's Side" />
                        <Button size="sm" onClick={() => createLink.mutate({ subEventId: se.id, groupName: newLinkGroupName })} disabled={createLink.isPending}>{createLink.isPending ? "Creating..." : "Create"}</Button>
                        <Button size="sm" variant="secondary" onClick={() => { setCreatingForSubEvent(null); setNewLinkGroupName(""); }}>Cancel</Button>
                      </div>
                      <p className="mt-1.5 text-xs text-dash-muted">Leave blank to use the default "Open Link RSVP" group. Enter a name to create or reuse a group — guests from this link will be sorted into that group.</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Button size="sm" variant="secondary" onClick={() => { setCreatingForSubEvent(se.id); setNewLinkGroupName(""); }} disabled={createLink.isPending}>Add Link</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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

      <Modal open={!!editingLink} onClose={() => setEditingLink(null)} title={editingLink?.is_primary ? "Edit Open RSVP Link (Primary)" : "Edit Open RSVP Link"}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dash-text">Link enabled</span>
            <Toggle checked={editEnabled} onChange={setEditEnabled} />
          </div>
          <div>
            <SectionLabel>Guest group</SectionLabel>
            <div className="mt-1.5">
              <select
                value={editGroupId ?? ""}
                onChange={(e) => { setEditGroupId(e.target.value || null); setEditGroupName(computeGroupName(e.target.value || null)); }}
                className="w-full rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
              >
                <option value="">Default (Open Link RSVP)</option>
                {(groups ?? []).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-dash-muted">Group name</label>
                <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} placeholder="Group name" />
                <p className="mt-1.5 text-xs text-dash-muted">Rename this group — it updates everywhere guests are sorted. If you selected "Default", this renames the default group all ungrouped links fall back to.</p>
              </div>
            </div>
          </div>
          <SectionLabel>Link ending</SectionLabel>
          <div>
            <div className="flex items-center gap-1 rounded-md border border-dash-border bg-dash-bg px-2 py-1.5">
              <span className="select-none text-sm text-dash-muted">{joinPrefix}</span>
              <input
                type="text"
                value={editToken}
                onChange={(e) => { setEditToken(e.target.value); setTokenError(null); }}
                placeholder="your-rsvp"
                className="flex-1 bg-transparent text-sm text-dash-text outline-none"
              />
            </div>
            {tokenError ? (
              <p className="mt-1.5 text-xs text-red-600">{tokenError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-dash-muted">
                Letters, numbers, and hyphens only. Changing this breaks any previously printed or shared QR codes for this link.
              </p>
            )}
          </div>
          <div>
            <SectionLabel>RSVP Deadline</SectionLabel>
            <div className="mt-1.5">
              <DateTimePicker label="Deadline for this event's open RSVP (optional)" value={editRsvpDeadline} onChange={setEditRsvpDeadline} />
              <p className="mt-1.5 text-xs text-dash-muted">Leave blank to keep this link open indefinitely. After the deadline, guests see a closed message and submissions are rejected.</p>
            </div>
          </div>
          {editingLink?.is_primary ? (<>
          <SectionLabel>Logo</SectionLabel>
          <ImageUpload userId={event.creator_id} value={editConfig.logoUrl ?? null} onChange={(url) => setEditConfig((p) => ({ ...p, logoUrl: url ?? undefined }))} label="Logo shown at the top of the RSVP page" />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="logo-size" className="text-xs font-medium text-dash-muted">Logo size</label>
              <span className="text-xs text-dash-muted">{editConfig.logoSize ?? 160} px</span>
            </div>
            <input
              id="logo-size"
              type="range"
              min="48"
              max="320"
              step="4"
              value={editConfig.logoSize ?? 160}
              onChange={(e) => setEditConfig((p) => ({ ...p, logoSize: Number(e.target.value) }))}
              className="w-full accent-dash-primary"
            />
          </div>
          <SectionLabel>Heading</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.heading ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, heading: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.headingBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, headingBm: v }))} />
          </div>
          <SectionLabel>Intro text</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.intro ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, intro: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.introBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, introBm: v }))} />
          </div>
          <CollapsibleGroup title="Page heading and intro typography">
            <TypographyControls label="Page heading typography" value={editConfig.headingTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, headingTypography: v }))} showText={false} />
            <TypographyControls label="Intro text typography" value={editConfig.introTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, introTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <SectionLabel>Name field label</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.nameLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, nameLabel: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.nameLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, nameLabelBm: v }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <WeightSelect label="Name weight (label & input)" value={editConfig.nameWeight} onChange={(v) => setEditConfig((p) => ({ ...p, nameWeight: v }))} />
            <LabeledColor label="Name text colour" value={editConfig.nameColor} onChange={(v) => setEditConfig((p) => ({ ...p, nameColor: v }))} />
          </div>
          <CollapsibleGroup title="Name typography">
            <TypographyControls label="Name label typography" value={editConfig.nameLabelTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, nameLabelTypography: v }))} showText={false} />
            <TypographyControls label="Name input typography" value={editConfig.nameInputTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, nameInputTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <SectionLabel>Name placeholder</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.namePlaceholder ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, namePlaceholder: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.namePlaceholderBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, namePlaceholderBm: v }))} />
          </div>
          <SectionLabel>RSVP button labels</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <LabeledInput label="Attending (EN)" value={editConfig.attendingLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, attendingLabel: v }))} />
              <LabeledInput label="Attending (BM)" value={editConfig.attendingLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, attendingLabelBm: v }))} />
              <WeightSelect label="Attending weight" value={editConfig.attendingWeight} onChange={(v) => setEditConfig((p) => ({ ...p, attendingWeight: v }))} />
              <LabeledColor label="Attending text colour" value={editConfig.attendingTextColor} onChange={(v) => setEditConfig((p) => ({ ...p, attendingTextColor: v }))} />
            </div>
            <div className="space-y-2">
              <LabeledInput label="Declined (EN)" value={editConfig.decliningLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, decliningLabel: v }))} />
              <LabeledInput label="Declined (BM)" value={editConfig.decliningLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, decliningLabelBm: v }))} />
              <WeightSelect label="Declined weight" value={editConfig.decliningWeight} onChange={(v) => setEditConfig((p) => ({ ...p, decliningWeight: v }))} />
              <LabeledColor label="Declined text colour" value={editConfig.decliningTextColor} onChange={(v) => setEditConfig((p) => ({ ...p, decliningTextColor: v }))} />
            </div>
          </div>
          <CollapsibleGroup title="RSVP button typography">
            <TypographyControls label="Attending button typography" value={editConfig.attendingTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, attendingTypography: v }))} showText={false} />
            <TypographyControls label="Declined button typography" value={editConfig.declinedTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, declinedTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <SectionLabel>Submit button label</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.submitLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, submitLabel: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.submitLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, submitLabelBm: v }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <WeightSelect label="Submit weight" value={editConfig.submitWeight} onChange={(v) => setEditConfig((p) => ({ ...p, submitWeight: v }))} />
            <LabeledColor label="Submit text colour" value={editConfig.submitTextColor} onChange={(v) => setEditConfig((p) => ({ ...p, submitTextColor: v }))} />
          </div>
          <CollapsibleGroup title="Submit button typography">
            <TypographyControls label="Submit button typography" value={editConfig.submitTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, submitTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <SectionLabel>Schedule / programme heading</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.scheduleHeading ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, scheduleHeading: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.scheduleHeadingBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, scheduleHeadingBm: v }))} />
          </div>
          <CollapsibleGroup title="Event details typography">
            <TypographyControls label="Event title typography" value={editConfig.eventTitleTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, eventTitleTypography: v }))} showText={false} />
            <TypographyControls label="Event time typography" value={editConfig.eventTimeTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, eventTimeTypography: v }))} showText={false} />
            <TypographyControls label="Venue / address typography" value={editConfig.eventAddressTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, eventAddressTypography: v }))} showText={false} />
            <TypographyControls label="RSVP deadline typography" value={editConfig.rsvpDeadlineTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, rsvpDeadlineTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <CollapsibleGroup title="Programme typography">
            <TypographyControls label="Programme heading typography" value={editConfig.scheduleHeadingTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, scheduleHeadingTypography: v }))} showText={false} />
            <TypographyControls label="Programme item typography" value={editConfig.programmeItemTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, programmeItemTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <SectionLabel>Thank-you messages</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <LabeledInput label="Attending (EN)" value={editConfig.thankYouAttending ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, thankYouAttending: v }))} />
              <LabeledInput label="Attending (BM)" value={editConfig.thankYouAttendingBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, thankYouAttendingBm: v }))} />
            </div>
            <div className="space-y-2">
              <LabeledInput label="Declined (EN)" value={editConfig.thankYouDeclined ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, thankYouDeclined: v }))} />
              <LabeledInput label="Declined (BM)" value={editConfig.thankYouDeclinedBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, thankYouDeclinedBm: v }))} />
            </div>
          </div>
          <SectionLabel>+1 question and buttons</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="Question (EN)" value={editConfig.plusOneQuestion ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneQuestion: v }))} />
            <LabeledInput label="Question (BM)" value={editConfig.plusOneQuestionBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneQuestionBm: v }))} />
          </div>
          <LabeledColor label="+1 question text colour" value={editConfig.plusOneQuestionColor} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneQuestionColor: v }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <LabeledInput label="Yes (EN)" value={editConfig.plusOneYesLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneYesLabel: v }))} />
              <LabeledInput label="Yes (BM)" value={editConfig.plusOneYesLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneYesLabelBm: v }))} />
              <WeightSelect label="+1 Yes weight" value={editConfig.plusOneYesWeight} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneYesWeight: v }))} />
              <LabeledColor label="+1 Yes text colour" value={editConfig.plusOneYesTextColor} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneYesTextColor: v }))} />
            </div>
            <div className="space-y-2">
              <LabeledInput label="No (EN)" value={editConfig.plusOneNoLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneNoLabel: v }))} />
              <LabeledInput label="No (BM)" value={editConfig.plusOneNoLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneNoLabelBm: v }))} />
              <WeightSelect label="+1 No weight" value={editConfig.plusOneNoWeight} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneNoWeight: v }))} />
              <LabeledColor label="+1 No text colour" value={editConfig.plusOneNoTextColor} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneNoTextColor: v }))} />
            </div>
          </div>
          <CollapsibleGroup title="+1 typography">
            <TypographyControls label="+1 question typography" value={editConfig.plusOneQuestionTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneQuestionTypography: v }))} showText={false} />
            <TypographyControls label="+1 Yes button typography" value={editConfig.plusOneYesTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneYesTypography: v }))} showText={false} />
            <TypographyControls label="+1 No button typography" value={editConfig.plusOneNoTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneNoTypography: v }))} showText={false} />
          </CollapsibleGroup>
          <SectionLabel>Phone number (optional)</SectionLabel>
          <div className="flex items-center gap-3">
            <Toggle checked={!!editConfig.phoneEnabled} onChange={(v) => setEditConfig((p) => ({ ...p, phoneEnabled: v }))} />
            <span className="text-sm text-dash-muted">Ask attending guests for a phone number</span>
          </div>
          {editConfig.phoneEnabled && (<>
            <div className="grid gap-3 sm:grid-cols-2">
              <LabeledInput label="Question (EN)" value={editConfig.phoneQuestion ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, phoneQuestion: v }))} />
              <LabeledInput label="Question (BM)" value={editConfig.phoneQuestionBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, phoneQuestionBm: v }))} />
              <LabeledInput label="Helper text (EN)" value={editConfig.phoneHelper ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, phoneHelper: v }))} />
              <LabeledInput label="Helper text (BM)" value={editConfig.phoneHelperBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, phoneHelperBm: v }))} />
              <LabeledInput label="Example text (EN)" value={editConfig.phoneExample ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, phoneExample: v }))} />
              <LabeledInput label="Example text (BM)" value={editConfig.phoneExampleBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, phoneExampleBm: v }))} />
              <LabeledColor label="Example text colour" value={editConfig.phoneExampleColor} onChange={(v) => setEditConfig((p) => ({ ...p, phoneExampleColor: v }))} />
            </div>
            <CollapsibleGroup title="Phone question typography">
              <TypographyControls label="Phone question typography" value={editConfig.phoneQuestionTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, phoneQuestionTypography: v }))} showText={false} />
            </CollapsibleGroup>
            <CollapsibleGroup title="Phone helper text typography">
              <TypographyControls label="Phone helper text typography" value={editConfig.phoneHelperTypography ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, phoneHelperTypography: v }))} showText={false} />
            </CollapsibleGroup>
          </>)}
          <CollapsibleGroup title="Button colours">
          <ButtonColourEditor label="Attending (selected)" value={editConfig.attendingColors ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, attendingColors: v }))} />
          <ButtonColourEditor label="Declined (selected)" value={editConfig.declinedColors ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, declinedColors: v }))} />
          <ButtonColourEditor label="+1 Yes (selected)" value={editConfig.plusOneYesColors ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneYesColors: v }))} />
          <ButtonColourEditor label="+1 No (selected)" value={editConfig.plusOneNoColors ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, plusOneNoColors: v }))} />
          <ButtonColourEditor label="Base Button Colours (unselected)" value={editConfig.buttonColors ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, buttonColors: v }))} />
          </CollapsibleGroup>
          </>) : (
            <div className="rounded-md border border-dash-border bg-dash-bg p-3 text-sm text-dash-muted">
              This link uses the shared Open RSVP page style. To change the page appearance, edit the link marked <span className="font-medium text-dash-text">Primary</span>.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingLink(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit || tokenChecking}>{savingEdit ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OpenLinkQr({ url, slug }: { url: string; slug: string }) {
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    if (url) generateQrDataUrl(url, { width: 200 }).then(setQr).catch(() => {});
  }, [url]);
  if (!qr) return null;
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "rsvp";
  return (
    <div className="flex items-center gap-3">
      <img src={qr} alt="QR code" className="h-28 w-28 rounded-lg border border-dash-border" />
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="secondary" onClick={() => downloadQrCode(url, `${safeSlug}-qr.png`)}>Download PNG</Button>
        <Button size="sm" variant="secondary" onClick={() => downloadQrSvg(url, `${safeSlug}-qr.svg`)}>Download SVG</Button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold uppercase tracking-wide text-dash-muted">{children}</h4>;
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-dash-muted">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const WEIGHT_OPTIONS = [
  { value: 400, label: "Normal" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
];

function WeightSelect({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-dash-muted">{label}</label>
      <select
        value={value ?? 600}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
      >
        {WEIGHT_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
      </select>
    </div>
  );
}

function LabeledColor({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-dash-muted">{label}</label>
      <ColorInput value={value ?? ""} onChange={onChange} />
    </div>
  );
}
