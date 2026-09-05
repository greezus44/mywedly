import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup, type SubEvent, type EventRsvp } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { GuestForm, RsvpBadge, type GuestFormValues } from "./guest-form";
import { BulkImportModal } from "./bulk-import";
import { generateUsername } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

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
  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as GuestGroup[]; },
  });
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });
  const { data: existingInvites } = useQuery({
    queryKey: ["guest-event-invites", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_event_invites").select("guest_id, sub_event_id, invite_type").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });

  // Group → sub_event assignments (for computing which events each guest is invited to via groups)
  const { data: groupAssignments } = useQuery({
    queryKey: ["group-assignments", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_event_group_assignments").select("group_id, sub_event_id"); if (error) throw error; return data ?? []; },
  });

  // Per-guest invitation overrides for all guests in this event
  const { data: allOverrides } = useQuery({
    queryKey: ["all-guest-invitation-overrides", eventId],
    queryFn: async () => {
      if (!guests || guests.length === 0) return [];
      const { data, error } = await supabase.from("guest_invitation_overrides").select("guest_id, sub_event_id, is_invited, allow_plus_one").in("guest_id", guests.map((g) => g.id));
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!guests && guests.length > 0,
  });

  // Compute invited events + +1 permission per guest
  const invitedEventsByGuest = new Map<string, string[]>();
  const plusOneEventsByGuest = new Map<string, Set<string>>();
  if (subEvents && subEvents.length > 0) {
    for (const g of (guests ?? [])) {
      const invited = new Set<string>();
      const plusOne = new Set<string>();
      if (g.group_id) {
        (groupAssignments ?? []).filter((a) => a.group_id === g.group_id).forEach((a) => invited.add(a.sub_event_id as string));
      }
      (existingInvites ?? []).filter((inv) => inv.guest_id === g.id && inv.invite_type === "include" && inv.sub_event_id).forEach((inv) => invited.add(inv.sub_event_id as string));
      (allOverrides ?? []).filter((o) => o.guest_id === g.id).forEach((o) => {
        const seId = o.sub_event_id as string;
        if (o.is_invited) { invited.add(seId); if (o.allow_plus_one) plusOne.add(seId); }
        else { invited.delete(seId); plusOne.delete(seId); }
      });
      invitedEventsByGuest.set(g.id, [...invited]);
      plusOneEventsByGuest.set(g.id, plusOne);
    }
  }

  const subEventNameById = new Map<string, string>((subEvents ?? []).map((se) => [se.id, se.name ?? "Untitled"]));

  // Load invitation overrides for the guest being edited
  const { data: editGuestOverrides } = useQuery({
    queryKey: ["guest-invitation-overrides", editGuest?.id],
    queryFn: async () => {
      if (!editGuest) return { invited: {} as Record<string, boolean>, plusOne: {} as Record<string, boolean> };
      const { data, error } = await supabase.from("guest_invitation_overrides").select("sub_event_id, is_invited, allow_plus_one").eq("guest_id", editGuest.id);
      if (error) throw error;
      const invited: Record<string, boolean> = {};
      const plusOne: Record<string, boolean> = {};
      (data ?? []).forEach((o) => { invited[o.sub_event_id as string] = o.is_invited as boolean; if (o.allow_plus_one) plusOne[o.sub_event_id as string] = o.allow_plus_one as boolean; });
      return { invited, plusOne };
    },
    enabled: !!editGuest,
  });

  const { data: rsvps } = useQuery({
    queryKey: ["event-rsvps-dashboard", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("guest_id, plus_one_names").eq("event_id", eventId); if (error) throw error; return (data ?? []) as Pick<EventRsvp, "guest_id" | "plus_one_names">[]; },
  });
  const plusOneNameFor = (guestId: string): string | null => {
    const r = rsvps?.find((r) => r.guest_id === guestId);
    return r?.plus_one_names?.[0] ?? null;
  };

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
        const { error } = await supabase.from("event_guests").update({ name: values.name, username: values.username, group_name: values.group_name, group_id: values.group_id, allow_plus_one: values.allow_plus_one }).eq("id", editGuest.id);
        if (error) throw error;
        guestId = editGuest.id;
      } else {
        const { data: newGuest, error } = await supabase.from("event_guests").insert({ event_id: eventId, name: values.name, username: values.username || generateUsername(values.name), group_name: values.group_name, group_id: values.group_id, token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0, allow_plus_one: values.allow_plus_one }).select("id").single();
        if (error) throw error;
        guestId = newGuest.id;
      }
      // Sync guest_group_members
      await supabase.from("guest_group_members").delete().eq("guest_id", guestId);
      if (values.group_id) {
        await supabase.from("guest_group_members").insert({ guest_id: guestId, group_id: values.group_id });
      }

      // Save per-event invitation overrides + per-event +1 settings
      if (subEvents && subEvents.length > 0) {
        // Delete existing overrides for this guest
        await supabase.from("guest_invitation_overrides").delete().eq("guest_id", guestId);
        // Insert new overrides
        const overridesToInsert: Array<{ guest_id: string; sub_event_id: string; is_invited: boolean; allow_plus_one: boolean }> = [];
        for (const se of subEvents) {
          const isInvited = values.eventInvitations[se.id] ?? false;
          const allowPlusOne = values.plusOnePerEvent[se.id] ?? false;
          overridesToInsert.push({ guest_id: guestId, sub_event_id: se.id, is_invited: isInvited, allow_plus_one: allowPlusOne });
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
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-dash-text">Guests</h2><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setShowBulkImport(true)}>Bulk Import</Button><Button size="sm" variant="secondary" onClick={() => setShowInvites(true)} disabled={!guests || guests.length === 0}>Manage Invitations</Button><Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button></div></div>
      {!guests || guests.length === 0 ? (
        <EmptyState title="No guests yet" description="Add guests to invite them to your event." action={<Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dash-border">
          <table className="w-full">
            <thead className="bg-dash-bg"><tr><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted"><input type="checkbox" checked={selectedGuestIds.size === guests.length && guests.length > 0} onChange={(e) => setSelectedGuestIds(e.target.checked ? new Set(guests.map((g) => g.id)) : new Set())} className="accent-dash-primary" /></th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Name</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Username</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Group</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Invited Events</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">RSVP</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">+1</th><th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th></tr></thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {guests.map((g) => (<tr key={g.id}><td className="px-4 py-2"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary" /></td><td className="px-4 py-2 text-sm text-dash-text">{g.name}</td><td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "—"}</td><td className="px-4 py-2 text-sm text-dash-muted">{g.group_name ?? "—"}</td><td className="px-4 py-2 text-sm text-dash-muted">{(invitedEventsByGuest.get(g.id) ?? []).map((id) => { const name = subEventNameById.get(id) ?? "Unknown"; const hasPlus1 = plusOneEventsByGuest.get(g.id)?.has(id); return hasPlus1 ? `${name} (+1)` : name; }).join(", ") || "—"}</td><td className="px-4 py-2"><RsvpBadge status={g.rsvp_status} /></td><td className="px-4 py-2 text-sm text-dash-muted">{g.allow_plus_one ? (plusOneNameFor(g.id) ?? "Yes") : "—"}</td><td className="px-4 py-2 text-right"><button onClick={() => { setEditGuest(g); setShowForm(true); }} className="mr-2 text-xs text-dash-primary hover:underline">Edit</button><button onClick={() => deleteMutation.mutate(g.id)} className="text-xs text-dash-danger hover:underline">Delete</button></td></tr>))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditGuest(null); setFormError(null); }} title={editGuest ? "Edit Guest" : "Add Guest"}>
        {formError && <p className="mb-3 text-sm text-dash-danger">{formError}</p>}
        <GuestForm
          eventId={eventId}
          guest={editGuest}
          groups={groups ?? []}
          subEvents={subEvents ?? []}
          existingInvitations={editGuest ? editGuestOverrides?.invited : undefined}
          existingPlusOnePerEvent={editGuest ? editGuestOverrides?.plusOne : undefined}
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
                  return <div key={i} className="flex items-center justify-between text-xs"><span className="text-dash-text">{g?.name ?? "Unknown"} → {se?.name ?? "Main Event"}</span><button onClick={() => removeInviteMutation.mutate({ guestId: inv.guest_id, subEventId: inv.sub_event_id ?? null })} className="text-dash-danger hover:underline">Remove</button></div>;
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
          const rows = importGuests.map((g) => ({ event_id: eventId, name: g.name, username: g.username, token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0, allow_plus_one: false }));
          const { error } = await supabase.from("event_guests").insert(rows);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
        }}
      />
    </div>
  );
}
