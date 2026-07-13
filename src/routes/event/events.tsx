import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type GuestGroup, type EventGuest, type SubEventGroupAssignment, type GuestInvitationOverride } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Modal, Card, EmptyState, FormField, Badge } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Plus, Calendar, Trash2, Edit2, GripVertical, ChevronDown, ChevronUp, Users, UserPlus, UserMinus, X } from "lucide-react";
import { formatDateShort, formatTime12 } from "../../lib/utils";

interface SubEventForm {
  name: string; description: string; date: string | null;
  start_time: string | null; end_time: string | null;
  venue: string; address: string; dress_code: string;
}

const EMPTY_FORM: SubEventForm = { name: "", description: "", date: null, start_time: null, end_time: null, venue: "", address: "", dress_code: "" };

export default function EventsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", event.id).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sub_events").insert({ parent_event_id: event.id, name: form.name, description: form.description || null, date: form.date, start_time: form.start_time, end_time: form.end_time, venue: form.venue, address: form.address, dress_code: form.dress_code, display_order: subEvents?.length || 0 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] }); setShowModal(false); setForm(EMPTY_FORM); setError(null); },
    onError: (err: any) => { const msg = err?.message || ""; setError("Unable to create sub-event: " + msg); console.error("Sub-event creation error:", err); },
  });

  const updateMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("sub_events").update({ name: form.name, description: form.description || null, date: form.date, start_time: form.start_time, end_time: form.end_time, venue: form.venue, address: form.address, dress_code: form.dress_code }).eq("id", editingId!); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] }); setShowModal(false); setEditingId(null); setForm(EMPTY_FORM); setError(null); },
    onError: (err: any) => alert("Failed to update: " + (err.message || "Unknown error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sub_events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] }),
    onError: (err: any) => alert("Failed to delete: " + (err.message || "Unknown error")),
  });

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setError(null); setShowModal(true); };
  const openEdit = (se: SubEvent) => { setForm({ name: se.name, description: se.description || "", date: se.date, start_time: se.start_time || se.time, end_time: se.end_time, venue: se.venue || "", address: se.address || "", dress_code: se.dress_code || "" }); setEditingId(se.id); setError(null); setShowModal(true); };
  const handleSubmit = () => { if (editingId) updateMutation.mutate(); else createMutation.mutate(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Sub-Events</h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Sub-Event</Button>
      </div>
      {isLoading ? <div className="text-center py-12 text-dash-muted">Loading...</div> : !subEvents || subEvents.length === 0 ? (
        <EmptyState icon={<Calendar className="w-12 h-12" />} title="No sub-events yet" description="Add sub-events like ceremony, reception, or after-party." action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Sub-Event</Button>} />
      ) : (
        <div className="space-y-3">
          {subEvents.map((se) => (
            <div key={se.id}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-dash-muted mt-1 cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-dash-text">{se.name}</h3>
                      <button onClick={() => setExpandedId(expandedId === se.id ? null : se.id)} className="text-dash-muted hover:text-dash-text">
                        {expandedId === se.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-dash-muted mt-1">
                      {se.date && <span>{formatDateShort(se.date)}</span>}
                      {se.start_time && <span>{formatTime12(se.start_time)}</span>}
                      {se.venue && <span>{se.venue}</span>}
                    </div>
                    {se.description && <p className="text-sm text-dash-muted mt-1">{se.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(se)} className="text-dash-muted hover:text-dash-primary"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete this sub-event?")) deleteMutation.mutate(se.id); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {expandedId === se.id && <InvitationManager subEvent={se} eventId={event.id} />}
              </Card>
            </div>
          ))}
        </div>
      )}
      <Modal open={showModal} onClose={() => { setShowModal(false); setError(null); }} title={editingId ? "Edit Sub-Event" : "New Sub-Event"}>
        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <FormField label="Name"><Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ceremony" /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} rows={2} /></FormField>
          <FormField label="Date"><DatePicker value={form.date} onChange={(d) => setForm({ ...form, date: d })} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time"><TimePicker value={form.start_time} onChange={(t) => setForm({ ...form, start_time: t })} /></FormField>
            <FormField label="End Time"><TimePicker value={form.end_time} onChange={(t) => setForm({ ...form, end_time: t })} /></FormField>
          </div>
          <FormField label="Venue"><Input value={form.venue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, venue: e.target.value })} /></FormField>
          <FormField label="Address"><Input value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })} /></FormField>
          <FormField label="Dress Code"><Input value={form.dress_code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, dress_code: e.target.value })} /></FormField>
          <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending} disabled={!form.name.trim()} className="w-full">{editingId ? "Save Changes" : "Create Sub-Event"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function InvitationManager({ subEvent, eventId }: { subEvent: SubEvent; eventId: string }) {
  const queryClient = useQueryClient();
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("sort_order", { ascending: true }); if (error) throw error; return data as GuestGroup[]; },
  });

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-group-assignments", subEvent.id],
    queryFn: async () => { const { data, error } = await supabase.from("sub_event_group_assignments").select("*").eq("sub_event_id", subEvent.id); if (error) throw error; return data as SubEventGroupAssignment[]; },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", subEvent.id],
    queryFn: async () => { const { data, error } = await supabase.from("guest_invitation_overrides").select("*").eq("sub_event_id", subEvent.id); if (error) throw error; return data as GuestInvitationOverride[]; },
  });

  const { data: allGuests } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });

  const { data: groupMembers } = useQuery({
    queryKey: ["group-members-all", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_group_members").select("*"); if (error) throw error; return data as { guest_id: string; group_id: string }[]; },
  });

  const toggleGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const existing = assignments?.find((a) => a.group_id === groupId);
      if (existing) {
        const { error } = await supabase.from("sub_event_group_assignments").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_event_group_assignments").insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", subEvent.id] }); },
    onError: (err: any) => alert("Failed to update group assignment: " + (err.message || "Unknown error")),
  });

  const addOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const existing = overrides?.find((o) => o.guest_id === guestId);
      if (existing) {
        const { error } = await supabase.from("guest_invitation_overrides").update({ is_invited: isInvited }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guest_invitation_overrides").insert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", subEvent.id] }); setShowGuestPicker(false); },
    onError: (err: any) => alert("Failed to update override: " + (err.message || "Unknown error")),
  });

  const removeOverrideMutation = useMutation({
    mutationFn: async (overrideId: string) => {
      const { error } = await supabase.from("guest_invitation_overrides").delete().eq("id", overrideId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", subEvent.id] }),
    onError: (err: any) => alert("Failed to remove override: " + (err.message || "Unknown error")),
  });

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) || []);
  const manualAdditions = overrides?.filter((o) => o.is_invited) || [];
  const manualRemovals = overrides?.filter((o) => !o.is_invited) || [];

  const guestsInAssignedGroups = new Set<string>();
  (groupMembers || []).forEach((gm) => {
    if (assignedGroupIds.has(gm.group_id)) guestsInAssignedGroups.add(gm.guest_id);
  });

  const manualRemovalIds = new Set(manualRemovals.map((o) => o.guest_id));
  const manualAdditionIds = new Set(manualAdditions.map((o) => o.guest_id));
  const totalInvited = guestsInAssignedGroups.size - manualRemovalIds.size + manualAdditionIds.size;

  const availableGuestsForAdd = (allGuests || []).filter((g) => !guestsInAssignedGroups.has(g.id) || manualRemovalIds.has(g.id));

  return (
    <div className="mt-4 pt-4 border-t border-dash-border space-y-4">
      <h4 className="text-sm font-medium text-dash-text">Invitation Management</h4>

      {/* Assigned Guest Groups */}
      <div>
        <p className="text-xs font-medium text-dash-muted uppercase mb-2">Assigned Guest Groups</p>
        {(!groups || groups.length === 0) ? (
          <p className="text-sm text-dash-muted">No groups available. Create groups in the Groups tab.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const isAssigned = assignedGroupIds.has(group.id);
              const memberCount = (groupMembers || []).filter((gm) => gm.group_id === group.id).length;
              return (
                <button key={group.id} onClick={() => toggleGroupMutation.mutate(group.id)} className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${isAssigned ? "bg-dash-primary text-white border-dash-primary" : "bg-white text-dash-text border-dash-border hover:border-dash-primary"}`}>
                  {group.name} ({memberCount})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Additions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-dash-muted uppercase">Manual Additions</p>
          <button onClick={() => setShowGuestPicker(true)} className="text-xs text-dash-primary hover:underline flex items-center gap-1"><UserPlus className="w-3 h-3" /> Add Guest</button>
        </div>
        {manualAdditions.length === 0 ? (
          <p className="text-sm text-dash-muted">No manually added guests.</p>
        ) : (
          <div className="space-y-1">
            {manualAdditions.map((o) => {
              const guest = allGuests?.find((g) => g.id === o.guest_id);
              return (
                <div key={o.id} className="flex items-center justify-between py-1 px-2 bg-green-50 rounded">
                  <span className="text-sm text-dash-text">{guest?.name || "Unknown"}</span>
                  <button onClick={() => removeOverrideMutation.mutate(o.id)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Removals */}
      <div>
        <p className="text-xs font-medium text-dash-muted uppercase mb-2">Manual Removals</p>
        {manualRemovals.length === 0 ? (
          <p className="text-sm text-dash-muted">No manually removed guests.</p>
        ) : (
          <div className="space-y-1">
            {manualRemovals.map((o) => {
              const guest = allGuests?.find((g) => g.id === o.guest_id);
              return (
                <div key={o.id} className="flex items-center justify-between py-1 px-2 bg-red-50 rounded">
                  <span className="text-sm text-dash-text">{guest?.name || "Unknown"}</span>
                  <button onClick={() => removeOverrideMutation.mutate(o.id)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-lg font-bold text-dash-text">{totalInvited}</p>
          <p className="text-xs text-dash-muted">Total Invited</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-lg font-bold text-dash-text">{guestsInAssignedGroups.size}</p>
          <p className="text-xs text-dash-muted">Via Groups</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">+{manualAdditions.length}</p>
          <p className="text-lg font-bold text-red-600">-{manualRemovals.length}</p>
          <p className="text-xs text-dash-muted">Manual Overrides</p>
        </div>
      </div>

      {/* Guest Picker Modal */}
      <Modal open={showGuestPicker} onClose={() => setShowGuestPicker(false)} title="Add Guest to Sub-Event">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableGuestsForAdd.length === 0 ? (
            <p className="text-sm text-dash-muted">All guests are already invited via groups.</p>
          ) : (
            availableGuestsForAdd.map((guest) => {
              const isRemoved = manualRemovalIds.has(guest.id);
              return (
                <div key={guest.id} className="flex items-center justify-between py-2 px-3 border border-dash-border rounded-lg">
                  <div>
                    <span className="text-sm text-dash-text">{guest.name}</span>
                    {isRemoved && <Badge variant="danger">Removed</Badge>}
                  </div>
                  <button onClick={() => addOverrideMutation.mutate({ guestId: guest.id, isInvited: true })} className="text-sm text-dash-primary hover:underline flex items-center gap-1"><UserPlus className="w-3 h-3" /> Add</button>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
