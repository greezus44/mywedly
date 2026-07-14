import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup, type EventGuest, type GuestGroupMember } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Textarea, EmptyState, LoadingSpinner, ErrorState, Modal, Badge } from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());

  const { data: groups, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["group-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Pick<EventGuest, "id" | "name">[];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["group-members", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("id, group_id, guest_id")
        .in("group_id", (groups ?? []).map((g) => g.id));
      if (error) throw error;
      return data as GuestGroupMember[];
    },
    enabled: !!(groups && groups.length > 0),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name, description: description || null })
          .eq("id", editing.id);
        if (error) throw error;

        // Update members: remove old, add new
        const { error: delError } = await supabase
          .from("guest_group_members")
          .delete()
          .eq("group_id", editing.id);
        if (delError) throw delError;

        if (selectedGuests.size > 0) {
          const inserts = Array.from(selectedGuests).map((guest_id) => ({ group_id: editing.id, guest_id }));
          const { error: insError } = await supabase
            .from("guest_group_members")
            .insert(inserts);
          if (insError) throw insError;
        }
      } else {
        const { data: newGroup, error } = await supabase
          .from("guest_groups")
          .insert({ event_id: eventId, name, description: description || null })
          .select()
          .single();
        if (error) throw error;

        if (selectedGuests.size > 0) {
          const inserts = Array.from(selectedGuests).map((guest_id) => ({ group_id: newGroup.id, guest_id }));
          const { error: insError } = await supabase
            .from("guest_group_members")
            .insert(inserts);
          if (insError) throw insError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      setShowModal(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: memberError } = await supabase
        .from("guest_group_members")
        .delete()
        .eq("group_id", id);
      if (memberError) throw memberError;
      const { error } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedGuests(new Set());
    setShowModal(true);
  };

  const openEdit = (group: GuestGroup) => {
    setEditing(group);
    setName(group.name);
    setDescription(group.description || "");
    const groupMembers = (members ?? []).filter((m) => m.group_id === group.id).map((m) => m.guest_id);
    setSelectedGuests(new Set(groupMembers));
    setShowModal(true);
  };

  const toggleGuest = (guestId: string) => {
    setSelectedGuests((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load groups"
        message={error instanceof Error ? error.message : "An error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  const memberCount = (groupId: string) => (members ?? []).filter((m) => m.group_id === groupId).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
          <p className="text-sm text-dash-muted">Organize guests into groups for targeted invitations.</p>
        </div>
        <Button onClick={openCreate}>Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          message="Create groups to organize your guests (e.g. Family, Friends, Colleagues)."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-dash-text">{group.name}</h3>
                  {group.description && (
                    <p className="mt-1 text-sm text-dash-muted">{group.description}</p>
                  )}
                  <div className="mt-2">
                    <Badge variant="info">{memberCount(group.id)} members</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(group.id)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-danger"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Group" : "Add Group"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
          />
          {guests && guests.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Members</label>
              <div className="max-h-48 space-y-1 overflow-auto rounded-lg border border-dash-border p-2">
                {guests.map((guest) => (
                  <label key={guest.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-dash-bg">
                    <input
                      type="checkbox"
                      checked={selectedGuests.has(guest.id)}
                      onChange={() => toggleGuest(guest.id)}
                      className="h-4 w-4 rounded border-dash-border text-dash-primary focus:ring-dash-primary"
                    />
                    <span className="text-sm text-dash-text">{guest.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
