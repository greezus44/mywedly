import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { GuestForm, type GuestFormValues } from "./guest-form";
import { BulkImportModal } from "./bulk-import";
import { generateUsername } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

type GuestStatus = "not_invited" | "pending" | "attending" | "declined";

function StatusIcon({ status }: { status: GuestStatus }) {
  if (status === "attending") return <span className="text-green-600 font-bold text-base" title="Attending">&#10003;</span>;
  if (status === "declined") return <span className="text-red-500 font-bold text-base" title="Declined">&#10007;</span>;
  if (status === "pending") return <span className="text-dash-muted font-bold text-base" title="Pending">=</span>;
  return <span className="text-dash-muted text-base" title="Not invited">&mdash;</span>;
}

export function GuestsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<EventGuest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showInvites, setShowInvites] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [inviteSubEventId, setInviteSubEventId] = useState<string>("");

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("created_at", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });
  const { data: existingInvites } = useQuery({
    queryKey: ["guest-event-invites", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_event_invites").select("guest_id, sub_event_id, invite_type").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });

  const { data: allOverrides } = useQuery({
    queryKey: ["all-guest-invitation-overrides", eventId],
    queryFn: async () => {
      if (!guests || guests.length === 0) return [];
      const { data, error } = await supabase.from("guest_invitation_overrides").select("guest_id, sub_event_id, is_invited").in("guest_id", guests.map((g) => g.id));
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!guests && guests.length > 0,
  });

  // Fetch all RSVPs for this event (including sub_event_id and status)
  const { data: allRsvps } = useQuery({
    queryKey: ["event-rsvps-full", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("guest_id, sub_event_id, status").eq("event_id", eventId); if (error) throw error; return (data ?? []) as Pick<EventRsvp, "guest_id" | "sub_event_id" | "status">[]; },
  });

  // Compute invited events per guest
  const invitedEventsByGuest = new Map<string, Set<string>>();
  if (subEvents && subEvents.length > 0) {
    for (const g of (guests ?? [])) {
      const invited = new Set<string>();
      (existingInvites ?? []).filter((inv) => inv.guest_id === g.id && inv.invite_type === "include" && inv.sub_event_id).forEach((inv) => invited.add(inv.sub_event_id as string));
      (allOverrides ?? []).filter((o) => o.guest_id === g.id).forEach((o) => {
        const seId = o.sub_event_id as string;
        if (o.is_invited) { invited.add(seId); }
        else { invited.delete(seId); }
      });
      invitedEventsByGuest.set(g.id, invited);
    }
  }

  // Compute RSVP status per guest per sub_event
  const rsvpStatusByGuest = new Map<string, Map<string, string>>();
  for (const r of (allRsvps ?? [])) {
    let inner = rsvpStatusByGuest.get(r.guest_id);
    if (!inner) { inner = new Map(); rsvpStatusByGuest.set(r.guest_id, inner); }
    const key = r.sub_event_id ?? "__main__";
    inner.set(key, r.status);
  }

  const statusFor = (guestId: string, tabKey: string): GuestStatus => {
    if (tabKey === "__main__") {
      const g = guests?.find((gg) => gg.id === guestId);
      const s = g?.rsvp_status;
      if (s === "attending") return "attending";
      if (s === "declined") return "declined";
      if (!subEvents || subEvents.length === 0) return "pending";
      return "pending";
    }
    const invited = invitedEventsByGuest.get(guestId);
    if (!invited || !invited.has(tabKey)) return "not_invited";
    const rsvpMap = rsvpStatusByGuest.get(guestId);
    const status = rsvpMap?.get(tabKey);
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

  const visibleGuests = guests ?? [];


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_guests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }),
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ guestIds, subEventId }: { guestIds: string[]; subEventId: string | null }) => {
      const rows = guestIds.map((gid) => ({ guest_id: gid, event_id: eventId, sub_event_id: subEventId, invite_type: "include" as const }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("guest_event_invites").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] }); setSelectedGuestIds(new Set()); },
  });

  const removeInviteMutation = useMutation({
    mutationFn: async ({ guestId, subEventId }: { guestId: string; subEventId: string | null }) => {
      let query = supabase.from("guest_event_invites").delete().eq("guest_id", guestId).eq("event_id", eventId);
      if (subEventId) query = query.eq("sub_event_id", subEventId); else query = query.is("sub_event_id", null);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] }),
  });

  const toggleGuestSelection = (id: string) => {
    setSelectedGuestIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleAddOrUpdate = async (values: GuestFormValues) => {
    setSubmitting(true); setFormError(null);
    try {
      let guestId: string;
      if (editGuest) {
        const { error } = await supabase.from("event_guests").update({ name: values.name, username: values.username }).eq("id", editGuest.id);
        if (error) throw error;
        guestId = editGuest.id;
      } else {
        const { data: newGuest, error } = await supabase.from("event_guests").insert({ event_id: eventId, name: values.name, username: values.username || generateUsername(values.name), token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0 }).select("id").single();
        if (error) throw error;
        guestId = newGuest.id;
      }

      if (subEvents && subEvents.length > 0) {
        await supabase.from("guest_invitation_overrides").delete().eq("guest_id", guestId);
        const overridesToInsert: Array<{ guest_id: string; sub_event_id: string; is_invited: boolean }> = [];
        for (const se of subEvents) {
          const isInvited = values.eventInvitations[se.id] ?? false;
          overridesToInsert.push({ guest_id: guestId, sub_event_id: se.id, is_invited: isInvited });
        }
        if (overridesToInsert.length > 0) {
          const { error: overrideError } = await supabase.from("guest_invitation_overrides").insert(overridesToInsert);
          if (overrideError) throw overrideError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", guestId] });
      setShowForm(false); setEditGuest(null);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Failed to save guest"); }
    finally { setSubmitting(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load guests" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowBulkImport(true)}>Bulk Import</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowInvites(true)} disabled={!guests || guests.length === 0}>Manage Invitations</Button>
          <Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>
        </div>
      </div>

      {!guests || guests.length === 0 ? (
        <EmptyState title="No guests yet" description="Add guests to invite them to your event." action={<Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>} />
      ) : (
        <>
          <div className="text-xs text-dash-muted">
            <span className="text-green-600 font-bold">&#10003;</span> Attending &nbsp; <span className="text-red-500 font-bold">&#10007;</span> Declined &nbsp; <span className="font-bold">=</span> Pending &nbsp; <span>&mdash;</span> Not invited
          </div>

          <div className="overflow-x-auto rounded-lg border border-dash-border">
            <table className="w-full">
              <thead className="bg-dash-bg">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">
                    <input type="checkbox" checked={selectedGuestIds.size === visibleGuests.length && visibleGuests.length > 0} onChange={(e) => setSelectedGuestIds(e.target.checked ? new Set(visibleGuests.map((g) => g.id)) : new Set())} className="accent-dash-primary" />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Username</th>
                  {eventColumns.length > 0 ? (
                    eventColumns.map((col) => (
                      <th key={col.key} className="px-4 py-2 text-center text-xs font-medium text-dash-muted whitespace-nowrap">{col.label}</th>
                    ))
                  ) : (
                    <th className="px-4 py-2 text-center text-xs font-medium text-dash-muted">Status</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border bg-dash-surface">
                {visibleGuests.map((g) => {
                  return (
                    <tr key={g.id}>
                      <td className="px-4 py-2"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary" /></td>
                      <td className="px-4 py-2 text-sm text-dash-text">{g.name}</td>
                      <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "\u2014"}</td>
                      {eventColumns.length > 0 ? (
                        eventColumns.map((col) => (
                          <td key={col.key} className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, col.key)} /></td>
                        ))
                      ) : (
                        <td className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, "__main__")} /></td>
                      )}
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => { setEditGuest(g); setShowForm(true); }} className="mr-2 text-xs text-dash-primary hover:underline">Edit</button>
                        <button onClick={() => deleteMutation.mutate(g.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditGuest(null); setFormError(null); }} title={editGuest ? "Edit Guest" : "Add Guest"}>
        {formError && <p className="mb-3 text-sm text-dash-danger">{formError}</p>}
        <GuestForm
          eventId={eventId}
          guest={editGuest}
          subEvents={subEvents ?? []}
          existingInvitations={editGuest ? Object.fromEntries([...(invitedEventsByGuest.get(editGuest.id) ?? [])].map((id) => [id, true])) : undefined}
          onSubmit={handleAddOrUpdate}
          onCancel={() => { setShowForm(false); setEditGuest(null); setFormError(null); }}
          submitting={submitting}
        />
      </Modal>

      <Modal open={showInvites} onClose={() => setShowInvites(false)} title="Manage Invitations">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">Select guests above using the checkboxes, then assign them to an event.</p>
          <div className="flex items-center gap-2">
            <select value={inviteSubEventId} onChange={(e) => setInviteSubEventId(e.target.value)} className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text">
              <option value="">Main Event</option>
              {(subEvents ?? []).map((se) => <option key={se.id} value={se.id}>{se.name}</option>)}
            </select>
            <Button size="sm" onClick={() => inviteMutation.mutate({ guestIds: [...selectedGuestIds], subEventId: inviteSubEventId || null })} disabled={selectedGuestIds.size === 0} loading={inviteMutation.isPending}>Invite</Button>
          </div>
          {inviteMutation.isError && <p className="text-sm text-dash-danger">{inviteMutation.error instanceof Error ? inviteMutation.error.message : "Failed to invite"}</p>}
          {inviteMutation.isSuccess && <p className="text-sm text-green-600">Invitations sent.</p>}
          {selectedGuestIds.size > 0 && <p className="text-sm text-dash-muted">{selectedGuestIds.size} guest(s) selected</p>}
          {existingInvites && existingInvites.length > 0 && (
            <div className="space-y-2 border-t border-dash-border pt-3">
              <h4 className="text-xs font-semibold text-dash-text">Existing Invitations</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {existingInvites.map((inv, i) => {
                  const g = guests?.find((gg) => gg.id === inv.guest_id);
                  const se = subEvents?.find((s) => s.id === inv.sub_event_id);
                  return <div key={i} className="flex items-center justify-between text-xs"><span className="text-dash-text">{g?.name ?? "Unknown"} \u2192 {se?.name ?? "Main Event"}</span><button onClick={() => removeInviteMutation.mutate({ guestId: inv.guest_id, subEventId: inv.sub_event_id ?? null })} className="text-dash-danger hover:underline">Remove</button></div>;
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        existingUsernames={new Set((guests ?? []).map((g) => (g.username ?? "").toLowerCase()).filter(Boolean))}
        onImport={async (importGuests) => {
          const rows = importGuests.map((g) => ({ event_id: eventId, name: g.name, username: g.username, token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0 }));
          const { error } = await supabase.from("event_guests").insert(rows);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
        }}
      />
    </div>
  );
}
