import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase, type UserEvent, type SubEvent, type GuestGroup,
  type EventGuest, type SubEventGroupAssignment, type GuestInvitationOverride,
} from "../../lib/supabase";
import { Input, Textarea, Select, Modal, LoadingSpinner, ErrorState, EmptyState, Card, Badge, Toggle } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { formatDate, formatTime12, cn } from "../../lib/utils";

interface SubEventForm {
  name: string; date: string; start_time: string; end_time: string;
  venue: string; address: string; description: string; dress_code: string;
}

const EMPTY_FORM: SubEventForm = {
  name: "", date: "", start_time: "", end_time: "", venue: "", address: "", description: "", dress_code: "",
};

/* --------------------------- InvitationManager --------------------------- */

function InvitationManager({ subEvent, groups, guests }: { subEvent: SubEvent; groups: GuestGroup[]; guests: EventGuest[] }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [manualGuestId, setManualGuestId] = useState("");

  const { data: assignments } = useQuery({
    queryKey: ["sub_event_group_assignments", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments").select("*").eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest_invitation_overrides", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_invitation_overrides").select("*").eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: async ({ groupId, enable }: { groupId: string; enable: boolean }) => {
      if (enable) {
        const { error } = await supabase.from("sub_event_group_assignments").insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_event_group_assignments").delete()
          .eq("sub_event_id", subEvent.id).eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_event_group_assignments", subEvent.id] });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const { error } = await supabase.from("guest_invitation_overrides")
        .upsert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: isInvited }, {
          onConflict: "sub_event_id,guest_id",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_invitation_overrides", subEvent.id] });
      setManualGuestId("");
    },
  });

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id));
  const invitedOverrides = new Set(overrides?.filter((o) => o.is_invited).map((o) => o.guest_id));
  const removedOverrides = new Set(overrides?.filter((o) => !o.is_invited).map((o) => o.guest_id));

  // Calculate total invited count
  const groupGuestCount = guests.filter((g) => assignedGroupIds.has(g.group_id || "") && !removedOverrides.has(g.id)).length;
  const manualAddCount = guests.filter((g) => invitedOverrides.has(g.id)).length;
  const totalInvited = groupGuestCount + manualAddCount;

  return (
    <div className="border-t border-dash-border pt-4">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between text-sm font-medium text-dash-text">
        <span>Invitations ({totalInvited} invited)</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Group toggles */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-dash-text">Guest Groups</h4>
            <div className="flex flex-wrap gap-2">
              {groups.length === 0 && <p className="text-xs text-dash-muted">No groups created yet.</p>}
              {groups.map((group) => {
                const isAssigned = assignedGroupIds.has(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroupMutation.mutate({ groupId: group.id, enable: !isAssigned })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      isAssigned
                        ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                        : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {group.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual guest additions */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-dash-text">Manual Guest Additions</h4>
            <div className="flex gap-2">
              <Select value={manualGuestId} onChange={(e) => setManualGuestId(e.target.value)} className="flex-1">
                <option value="">Select a guest to add...</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} {g.email ? `(${g.email})` : ""}</option>
                ))}
              </Select>
              <Button
                size="sm"
                disabled={!manualGuestId}
                loading={overrideMutation.isPending}
                onClick={() => overrideMutation.mutate({ guestId: manualGuestId, isInvited: true })}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Manual removals */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-dash-text">Manual Removals</h4>
            <div className="flex gap-2">
              <Select value="" onChange={(e) => { if (e.target.value) overrideMutation.mutate({ guestId: e.target.value, isInvited: false }); }} className="flex-1">
                <option value="">Select a guest to remove...</option>
                {guests.filter((g) => !removedOverrides.has(g.id)).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-dash-bg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dash-muted">Total Invited:</span>
              <span className="font-bold text-dash-text">{totalInvited}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Main Page ------------------------------ */

export default function Events() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: subEvents, isLoading, error: queryError } = useQuery({
    queryKey: ["sub_events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", event.id).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", event.id).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event_guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", event.id);
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        parent_event_id: event.id, name: form.name,
        date: form.date || null, start_time: form.start_time || null, end_time: form.end_time || null,
        venue: form.venue, address: form.address, description: form.description, dress_code: form.dress_code,
      };
      if (editingId) {
        const { error } = await supabase.from("sub_events").update(payload).eq("id", editingId).select().maybeSingle();
        if (error) throw error;
      } else {
        const maxOrder = subEvents?.reduce((max, s) => Math.max(max, s.display_order), -1) ?? -1;
        const { error } = await supabase.from("sub_events").insert({ ...payload, display_order: maxOrder + 1, order_index: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_events", event.id] });
      setModalOpen(false); setForm(EMPTY_FORM); setEditingId(null); setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub_events", event.id] }),
  });

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setError(null); setModalOpen(true); }
  function openEdit(se: SubEvent) {
    setForm({ name: se.name, date: se.date || "", start_time: se.start_time || "", end_time: se.end_time || "", venue: se.venue, address: se.address, description: se.description || "", dress_code: se.dress_code || "" });
    setEditingId(se.id); setError(null); setModalOpen(true);
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (queryError) return <ErrorState message="Failed to load events." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage individual events within your website and their guest invitations.</p>
        </div>
        <Button onClick={openAdd}>Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState title="No events yet" description="Add events to create a schedule for your website." action={<Button onClick={openAdd}>Add Event</Button>} />
      ) : (
        <div className="space-y-4">
          {subEvents.map((se) => (
            <Card key={se.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-dash-text">{se.name}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-dash-muted">
                    {se.date && <span>{formatDate(se.date)}</span>}
                    {se.start_time && <span>{formatTime12(se.start_time)}{se.end_time ? ` – ${formatTime12(se.end_time)}` : ""}</span>}
                    {se.venue && <span>{se.venue}</span>}
                    {se.address && <span>{se.address}</span>}
                    {se.dress_code && <Badge variant="info">{se.dress_code}</Badge>}
                  </div>
                  {se.description && <p className="mt-2 text-sm text-dash-muted">{se.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(se)}>Edit</Button>
                  <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(se.id)}>Delete</Button>
                </div>
              </div>
              <InvitationManager subEvent={se} groups={groups || []} guests={guests || []} />
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(null); }} title={editingId ? "Edit Event" : "Add Event"} size="lg">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ceremony" autoFocus />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="End Time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Dress Code" value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} />
          </div>
          {error && <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setError(null); }}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.name.trim()} onClick={() => saveMutation.mutate()}>{editingId ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
