import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function GroupsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: groups, isLoading, isError, error } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as GuestGroup[]; },
  });
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("id, name").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });
  const { data: assignments } = useQuery({
    queryKey: ["group-assignments", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_event_group_assignments").select("id, sub_event_id, group_id").in("group_id", (groups ?? []).map((g) => g.id)); if (error) throw error; return data ?? []; },
    enabled: !!(groups && groups.length > 0),
  });
  const { data: groupMembers } = useQuery({
    queryKey: ["group-members", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_group_members").select("group_id, guest_id"); if (error) throw error; return data ?? []; },
  });

  const guestCountByGroup = new Map<string, number>();
  (groupMembers ?? []).forEach((m) => { const gid = m.group_id as string; guestCountByGroup.set(gid, (guestCountByGroup.get(gid) ?? 0) + 1); });

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try { const { error } = await supabase.from("guest_groups").insert({ event_id: eventId, name: groupName.trim(), sort_order: 0 }); if (error) throw error; queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); setShowForm(false); setGroupName(""); }
    catch (err) { setFormError(err instanceof Error ? err.message : "Failed to create group"); }
    finally { setSubmitting(false); }
  };

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => { await supabase.from("sub_event_group_assignments").delete().eq("group_id", id); await supabase.from("guest_group_members").delete().eq("group_id", id); await supabase.from("event_guests").update({ group_id: null }).eq("group_id", id); const { error } = await supabase.from("guest_groups").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); queryClient.invalidateQueries({ queryKey: ["group-assignments", eventId] }); queryClient.invalidateQueries({ queryKey: ["group-members", eventId] }); queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); },
  });

  const assignGroupToEvent = useMutation({
    mutationFn: async ({ groupId, subEventId }: { groupId: string; subEventId: string }) => {
      const { data: existing } = await supabase.from("sub_event_group_assignments").select("id").eq("group_id", groupId).eq("sub_event_id", subEventId).maybeSingle();
      if (existing) return;
      const { error } = await supabase.from("sub_event_group_assignments").insert({ group_id: groupId, sub_event_id: subEventId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-assignments", eventId] }),
  });

  const unassignGroupFromEvent = useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => { const { error } = await supabase.from("sub_event_group_assignments").delete().eq("id", assignmentId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-assignments", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load groups" message={error instanceof Error ? error.message : "Unknown error"} />;

  const assignmentMap = new Map<string, string>();
  (assignments ?? []).forEach((a) => assignmentMap.set(`${a.group_id}:${a.sub_event_id}`, a.id as string));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2><Button size="sm" onClick={() => setShowForm(true)}>Add Group</Button></div>
      <p className="text-sm text-dash-muted">Assign a group to an event to invite all guests in that group at once. You can still add or remove individual guests from each event.</p>
      {!groups || groups.length === 0 ? (
        <EmptyState title="No groups yet" description="Create groups to organise guests and invite them in bulk." action={<Button size="sm" onClick={() => setShowForm(true)}>Add Group</Button>} />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
              <div className="flex items-start justify-between"><div><h3 className="font-semibold text-dash-text">{g.name}</h3><p className="text-sm text-dash-muted">{guestCountByGroup.get(g.id) ?? 0} guest(s)</p></div><button onClick={() => deleteGroup.mutate(g.id)} className="text-xs text-dash-danger hover:underline">Delete</button></div>
              {(subEvents ?? []).length > 0 && (
                <div className="mt-4"><p className="mb-2 text-xs font-medium text-dash-muted">Invited to Events:</p><div className="flex flex-wrap gap-2">
                  {(subEvents ?? []).map((se) => {
                    const key = `${g.id}:${se.id}`; const isAssigned = assignmentMap.has(key);
                    return <button key={se.id} onClick={() => { if (isAssigned) unassignGroupFromEvent.mutate({ assignmentId: assignmentMap.get(key)! }); else assignGroupToEvent.mutate({ groupId: g.id, subEventId: se.id }); }} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${isAssigned ? "bg-dash-primary text-dash-primary-fg" : "bg-dash-bg text-dash-muted hover:text-dash-text"}`}>{se.name}{isAssigned ? " ✓" : " +"}</button>;
                  })}
                </div></div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setGroupName(""); setFormError(null); }} title="Add Group">
        <form onSubmit={createGroup} className="space-y-4">
          <Input label="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Groom's Family" required autoFocus />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setShowForm(false); setGroupName(""); setFormError(null); }}>Cancel</Button><Button type="submit" loading={submitting}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
