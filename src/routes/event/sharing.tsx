import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SharingEvent, type SubEvent, type OpenRsvpLink, type Json } from "../../lib/supabase";
import { Button, Input, Toggle, Modal, LoadingSpinner, Badge } from "../../components/ui";
import { generateQrDataUrl, downloadQrCode, downloadQrSvg } from "../../lib/qr";
import { useEffect } from "react";

interface EventContextValue { event: UserEvent; eventId: string; }

interface PageConfig {
  heading?: string;
  intro?: string;
  nameLabel?: string;
  attendingLabel?: string;
  decliningLabel?: string;
  plusOneLabel?: string;
  submitLabel?: string;
  thankYouAttending?: string;
  thankYouDeclined?: string;
  namePlaceholder?: string;
  plusOnePlaceholder?: string;
}

const DEFAULT_PAGE_CONFIG: PageConfig = {
  heading: "RSVP",
  intro: "Please let us know if you can make it.",
  nameLabel: "Your Name",
  attendingLabel: "Attending",
  decliningLabel: "Declined",
  plusOneLabel: "Bringing a +1? Enter their name",
  submitLabel: "Submit RSVP",
  thankYouAttending: "Thank you! We look forward to seeing you.",
  thankYouDeclined: "Thank you for letting us know.",
};

export function SharingPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [editingLink, setEditingLink] = useState<OpenRsvpLink | null>(null);
  const [editConfig, setEditConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG);
  const [editAllowPlusOne, setEditAllowPlusOne] = useState(false);
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
    setEditAllowPlusOne(link.allow_plus_one);
    setEditEnabled(link.is_enabled);
  };

  const saveEdit = async () => {
    if (!editingLink) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("open_rsvp_links")
      .update({ page_config: editConfig as unknown as Json, allow_plus_one: editAllowPlusOne, is_enabled: editEnabled })
      .eq("id", editingLink.id);
    setSavingEdit(false);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["open-rsvp-links", eventId] });
      setEditingLink(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Share</h2>
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
        <p className="mb-4 text-sm text-dash-muted">Create a unique link for each event. Guests fill in their name, RSVP, and optionally bring a +1 — they're added to your guest list under an "Open Link RSVP" group, invited only to that one event.</p>
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
                      {link?.allow_plus_one && <Badge variant="default">+1 allowed</Badge>}
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dash-text">Allow +1</span>
            <Toggle checked={editAllowPlusOne} onChange={setEditAllowPlusOne} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Heading</label>
            <Input value={editConfig.heading ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, heading: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Intro text</label>
            <Input value={editConfig.intro ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, intro: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Name field label</label>
            <Input value={editConfig.nameLabel ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, nameLabel: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Name placeholder</label>
            <Input value={editConfig.namePlaceholder ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, namePlaceholder: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">Attending label</label>
              <Input value={editConfig.attendingLabel ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, attendingLabel: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dash-text">Declined label</label>
              <Input value={editConfig.decliningLabel ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, decliningLabel: e.target.value }))} />
            </div>
          </div>
          {editAllowPlusOne && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-dash-text">+1 prompt label</label>
                <Input value={editConfig.plusOneLabel ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, plusOneLabel: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dash-text">+1 placeholder</label>
                <Input value={editConfig.plusOnePlaceholder ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, plusOnePlaceholder: e.target.value }))} />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Submit button label</label>
            <Input value={editConfig.submitLabel ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, submitLabel: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Thank-you message (attending)</label>
            <Input value={editConfig.thankYouAttending ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, thankYouAttending: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-dash-text">Thank-you message (declined)</label>
            <Input value={editConfig.thankYouDeclined ?? ""} onChange={(e) => setEditConfig((p) => ({ ...p, thankYouDeclined: e.target.value }))} />
          </div>
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
