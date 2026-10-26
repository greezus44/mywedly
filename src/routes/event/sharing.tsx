import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingEvent, type SubEvent, type OpenRsvpLink, type Json } from "../../lib/supabase";
import { Button, Input, Toggle, Modal, LoadingSpinner, Badge, ColorInput } from "../../components/ui";
import { ButtonColourEditor, type ButtonColors } from "../../components/ui/ButtonColourEditor";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { useEffect } from "react";

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

  const publicUrl = event.slug ? `${window.location.origin}/e/${event.slug}` : "";

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
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true });
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

  useEffect(() => {
    if (publicUrl) generateQrDataUrl(publicUrl, { width: 256 }).then(setQrUrl).catch(() => {});
  }, [publicUrl]);

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const findLinkForSubEvent = (subEventId: string) => openLinks?.find((l) => l.sub_event_id === subEventId);

  const createLink = useMutation({
    mutationFn: async (subEventId: string) => {
      const { data, error } = await supabase
        .from("open_rsvp_links")
        .insert({ event_id: eventId, sub_event_id: subEventId, allow_plus_one: false, is_enabled: true, page_config: DEFAULT_PAGE_CONFIG as unknown as Json })
        .select("*")
        .single();
      if (error) throw error;
      return data as OpenRsvpLink;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] }),
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] }),
  });

  const openEditor = (link: OpenRsvpLink) => {
    setEditingLink(link);
    setEditConfig({ ...DEFAULT_PAGE_CONFIG, ...((link.page_config ?? {}) as PageConfig) });
    setEditEnabled(link.is_enabled);
  };

  const saveEdit = async () => {
    if (!editingLink) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("open_rsvp_links")
      .update({ page_config: editConfig as unknown as Json, is_enabled: editEnabled })
      .eq("id", editingLink.id);
    setSavingEdit(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] });
      setEditingLink(null);
    }
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
        <p className="mb-4 text-sm text-dash-muted">Create a unique link for each event. Guests fill in their name and RSVP yes or no — they're added to your guest list under an "Open Link RSVP" group, invited only to that one event.</p>
        {createLink.isPending && <div className="mb-3"><LoadingSpinner className="h-6 w-6" /></div>}
        {(!subEvents || subEvents.length === 0) ? (
          <p className="text-sm text-dash-muted">No events found. Create events first in the Events tab.</p>
        ) : (
          <div className="space-y-3">
            {subEvents.map((se) => {
              const link = findLinkForSubEvent(se.id);
              const joinUrl = link ? `${window.location.origin}/join/${link.token}` : "";
              return (
                <div key={se.id} className="rounded-lg border border-dash-border bg-dash-bg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dash-text">{se.name}</span>
                      {link && <Badge variant={link.is_enabled ? "success" : "default"}>{link.is_enabled ? "Enabled" : "Disabled"}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {!link ? (
                        <Button size="sm" variant="secondary" onClick={() => createLink.mutate(se.id)} disabled={createLink.isPending}>Create Link</Button>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => openEditor(link)}>Edit</Button>
                          <Button size="sm" variant="secondary" onClick={() => toggleLink.mutate({ link, enabled: !link.is_enabled })}>{link.is_enabled ? "Disable" : "Enable"}</Button>
                          <Button size="sm" variant="danger" onClick={() => { if (confirm("Delete this open RSVP link? Guests who already registered will remain on your list.")) deleteLink.mutate(link); }}>Delete</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {link && joinUrl && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <Input value={joinUrl} readOnly />
                        <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(joinUrl); }}>Copy</Button>
                      </div>
                      <OpenLinkQr url={joinUrl} slug={se.name} />
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

      <Modal open={!!editingLink} onClose={() => setEditingLink(null)} title="Edit Open RSVP Link">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dash-text">Link enabled</span>
            <Toggle checked={editEnabled} onChange={setEditEnabled} />
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
          <SectionLabel>Name field label</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.nameLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, nameLabel: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.nameLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, nameLabelBm: v }))} />
          </div>
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
            </div>
            <div className="space-y-2">
              <LabeledInput label="Declined (EN)" value={editConfig.decliningLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, decliningLabel: v }))} />
              <LabeledInput label="Declined (BM)" value={editConfig.decliningLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, decliningLabelBm: v }))} />
            </div>
          </div>
          <SectionLabel>Submit button label</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.submitLabel ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, submitLabel: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.submitLabelBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, submitLabelBm: v }))} />
          </div>
          <SectionLabel>Schedule / programme heading</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="English" value={editConfig.scheduleHeading ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, scheduleHeading: v }))} />
            <LabeledInput label="Bahasa Melayu" value={editConfig.scheduleHeadingBm ?? ""} onChange={(v) => setEditConfig((p) => ({ ...p, scheduleHeadingBm: v }))} />
          </div>
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
          <SectionLabel>Selected button colours</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Attending colour</label>
              <ColorInput value={editConfig.attendingColor ?? "#16a34a"} onChange={(v) => setEditConfig((p) => ({ ...p, attendingColor: v }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Declined colour</label>
              <ColorInput value={editConfig.declinedColor ?? "#dc2626"} onChange={(v) => setEditConfig((p) => ({ ...p, declinedColor: v }))} />
            </div>
          </div>
          <ButtonColourEditor label="Base Button Colours (unselected)" value={editConfig.buttonColors ?? {}} onChange={(v) => setEditConfig((p) => ({ ...p, buttonColors: v }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingLink(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Saving..." : "Save"}</Button>
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
