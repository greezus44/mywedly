import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type SubEvent, type EventRsvp, type GuestGroup, type GroupEventInvite } from "../../lib/supabase";
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

const UNGROUPED_KEY = "__ungrouped__";

export function GuestsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<EventGuest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showInvites, setShowInvites] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [inviteSubEventId, setInviteSubEventId] = useState<string>("");
  const [bulkGroupId, setBulkGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });
  const { data: existingInvites } = useQuery({
    queryKey: ["guest-event-invites", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_event_invites").select("guest_id, sub_event_id, invite_type").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("sort_order", { ascending: true }); if (error) throw error; return data as GuestGroup[]; },
  });

  const { data: groupEventInvites } = useQuery({
    queryKey: ["group-event-invites", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("group_event_invites").select("*").eq("event_id", eventId); if (error) throw error; return (data ?? []) as GroupEventInvite[]; },
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

  const { data: allRsvps } = useQuery({
    queryKey: ["event-rsvps-full", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("guest_id, sub_event_id, status").eq("event_id", eventId); if (error) throw error; return (data ?? []) as Pick<EventRsvp, "guest_id" | "sub_event_id" | "status">[]; },
  });

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

  const sortedGroups = [...(groups ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const groupName = (id: string | null) => sortedGroups.find((g) => g.id === id)?.name ?? null;

  // Group guests: ordered by group sort_order, then "Ungrouped" last; within each group, alphabetical by name
  const groupedGuests: Array<{ key: string; label: string; guests: EventGuest[] }> = [];
  for (const gr of sortedGroups) {
    const gs = (guests ?? []).filter((g) => g.group_id === gr.id).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    if (gs.length > 0) groupedGuests.push({ key: gr.id, label: gr.name, guests: gs });
  }
  const ungrouped = (guests ?? []).filter((g) => !g.group_id).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  if (ungrouped.length > 0) groupedGuests.push({ key: UNGROUPED_KEY, label: "Ungrouped", guests: ungrouped });

  const visibleGuests = guests ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_guests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }),
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ guestIds, subEventId }: { guestIds: string[]; subEventId: string | null }) => {
      const rows = guestIds.map((gid) => ({ guest_id: gid, event_id: eventId, sub_event_id: subEventId, invite_type: "include" as const }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("guest_event_invites").upsert(rows, { onConflict: "guest_id,event_id,sub_event_id" });
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

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const sortOrder = (groups ?? []).length;
      const { error } = await supabase.from("guest_groups").insert({ event_id: eventId, name, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); setNewGroupName(""); },
  });

  const renameGroupMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("guest_groups").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("event_guests").update({ group_id: null }).eq("group_id", id).eq("event_id", eventId);
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); },
  });

  const bulkAssignGroupMutation = useMutation({
    mutationFn: async ({ guestIds, groupId }: { guestIds: string[]; groupId: string | null }) => {
      if (guestIds.length === 0) return;
      const { error } = await supabase.from("event_guests").update({ group_id: groupId }).in("id", guestIds);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); setSelectedGuestIds(new Set()); setBulkGroupId(""); },
  });

  const toggleGroupEventInviteMutation = useMutation({
    mutationFn: async ({ groupId, subEventId, checked }: { groupId: string; subEventId: string | null; checked: boolean }) => {
      if (checked) {
        const { error } = await supabase.from("group_event_invites").insert({ group_id: groupId, event_id: eventId, sub_event_id: subEventId });
        if (error) throw error;
      } else {
        let q = supabase.from("group_event_invites").delete().eq("group_id", groupId).eq("event_id", eventId);
        if (subEventId) q = q.eq("sub_event_id", subEventId); else q = q.is("sub_event_id", null);
        const { error } = await q;
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] }),
  });

  const toggleGuestSelection = (id: string) => {
    setSelectedGuestIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleAddOrUpdate = async (values: GuestFormValues) => {
    setSubmitting(true); setFormError(null);
    try {
      let guestId: string;
      if (editGuest) {
        const { error } = await supabase.from("event_guests").update({ name: values.name, username: values.username, group_id: values.groupId || null }).eq("id", editGuest.id);
        if (error) throw error;
        guestId = editGuest.id;
      } else {
        const { data: newGuest, error } = await supabase.from("event_guests").insert({ event_id: eventId, name: values.name, username: values.username || generateUsername(values.name), token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0, group_id: values.groupId || null }).select("id").single();
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

  const groupInviteChecked = (groupId: string, subEventId: string | null) =>
    (groupEventInvites ?? []).some((gi) => gi.group_id === groupId && (gi.sub_event_id ?? null) === (subEventId ?? null));

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load guests" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowBulkImport(true)}>Bulk Import</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowGroups(true)}>Manage Groups</Button>
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

          {selectedGuestIds.size > 0 && sortedGroups.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
              <span className="text-xs text-dash-muted">{selectedGuestIds.size} selected</span>
              <select value={bulkGroupId} onChange={(e) => setBulkGroupId(e.target.value)} className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text">
                <option value="">Assign to group…</option>
                <option value={UNGROUPED_KEY}>Ungrouped</option>
                {sortedGroups.map((gr) => <option key={gr.id} value={gr.id}>{gr.name}</option>)}
              </select>
              <Button size="sm" onClick={() => bulkAssignGroupMutation.mutate({ guestIds: [...selectedGuestIds], groupId: bulkGroupId === UNGROUPED_KEY ? null : bulkGroupId || null })} disabled={!bulkGroupId} loading={bulkAssignGroupMutation.isPending}>Assign</Button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-dash-border">
            <table className="w-full">
              <thead className="bg-dash-bg">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">
                    <input type="checkbox" checked={selectedGuestIds.size === visibleGuests.length && visibleGuests.length > 0} onChange={(e) => setSelectedGuestIds(e.target.checked ? new Set(visibleGuests.map((g) => g.id)) : new Set())} className="accent-dash-primary" />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Group</th>
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
                {groupedGuests.length === 0 ? (
                  (guests ?? []).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")).map((g) => (
                    <tr key={g.id}>
                      <td className="px-4 py-2"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary" /></td>
                      <td className="px-4 py-2 text-sm text-dash-text">{g.name}{g.plus_ones > 0 && <span className="ml-1.5 text-xs text-dash-muted">(+1)</span>}</td>
                      <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "\u2014"}</td>
                      <td className="px-4 py-2 text-sm text-dash-muted">—</td>
                      <td className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, "__main__")} /></td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => { setEditGuest(g); setShowForm(true); }} className="mr-2 text-xs text-dash-primary hover:underline">Edit</button>
                        <button onClick={() => deleteMutation.mutate(g.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  groupedGuests.flatMap((section) => [
                    <tr key={`sep-${section.key}`} onClick={() => toggleGroupCollapse(section.key)} className="cursor-pointer hover:bg-dash-surface/60">
                      <td colSpan={eventColumns.length > 0 ? eventColumns.length + 5 : 6} className="bg-dash-bg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-dash-text">
                        <span className="mr-1.5 inline-block w-3 text-dash-muted">{collapsedGroups.has(section.key) ? "\u25B6" : "\u25BC"}</span>
                        {section.label} <span className="ml-1 text-dash-muted">({section.guests.length})</span>
                      </td>
                    </tr>,
                    ...(collapsedGroups.has(section.key) ? [] : section.guests.map((g) => (
                      <tr key={g.id}>
                        <td className="px-4 py-2"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary" /></td>
                        <td className="px-4 py-2 text-sm text-dash-text">{g.name}{g.plus_ones > 0 && <span className="ml-1.5 text-xs text-dash-muted">(+1)</span>}</td>
                        <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "\u2014"}</td>
                        <td className="px-4 py-2 text-sm text-dash-muted">{groupName(g.group_id) ?? "—"}</td>
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
                    ))),
                  ])
                )}
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
          subEvents={sortedSubEvents}
          groups={sortedGroups}
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
              {sortedSubEvents.map((se) => <option key={se.id} value={se.id}>{se.name}</option>)}
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

      <Modal open={showGroups} onClose={() => { setShowGroups(false); setGroupError(null); setNewGroupName(""); }} title="Manage Groups">
        <div className="space-y-4">
          {groupError && <p className="text-sm text-dash-danger">{groupError}</p>}
          <div className="flex items-center gap-2">
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="New group name" className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text" />
            <Button size="sm" onClick={() => { setGroupError(null); createGroupMutation.mutate(newGroupName.trim(), { onError: (e) => setGroupError(e instanceof Error ? e.message : "Failed to create group") }); }} disabled={!newGroupName.trim()} loading={createGroupMutation.isPending}>Add</Button>
          </div>

          {sortedGroups.length > 0 && (
            <div className="space-y-3 border-t border-dash-border pt-3">
              {sortedSubEvents.length > 0 && (
                <p className="text-xs text-dash-muted">Tick which events each group is invited to. Guests in the group inherit these invitations.</p>
              )}
              {sortedGroups.map((gr) => (
                <div key={gr.id} className="space-y-2 rounded-lg border border-dash-border bg-dash-bg p-3">
                  <div className="flex items-center gap-2">
                    <input defaultValue={gr.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== gr.name) renameGroupMutation.mutate({ id: gr.id, name: v }); }} className="flex-1 rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text" />
                    <button onClick={() => deleteGroupMutation.mutate(gr.id)} className="text-xs text-dash-danger hover:underline" title="Delete group (guests become ungrouped)">Delete</button>
                  </div>
                  {sortedSubEvents.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
                      <label className="flex items-center gap-1.5 text-xs text-dash-text">
                        <input type="checkbox" checked={groupInviteChecked(gr.id, null)} onChange={(e) => toggleGroupEventInviteMutation.mutate({ groupId: gr.id, subEventId: null, checked: e.target.checked })} className="accent-dash-primary" />
                        Main Event
                      </label>
                      {sortedSubEvents.map((se) => (
                        <label key={se.id} className="flex items-center gap-1.5 text-xs text-dash-text">
                          <input type="checkbox" checked={groupInviteChecked(gr.id, se.id)} onChange={(e) => toggleGroupEventInviteMutation.mutate({ groupId: gr.id, subEventId: se.id, checked: e.target.checked })} className="accent-dash-primary" />
                          {tabLabel(se)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sortedGroups.length === 0 && (
            <p className="text-sm text-dash-muted">No groups yet. Create one above to start grouping your guests.</p>
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
