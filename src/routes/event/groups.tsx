import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup, type EventGuest, type GuestGroupMember } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge, Modal } from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managingGroup, setManagingGroup] = useState<GuestGroup | null>(null);
  const [selectedGuest, setSelectedGuest] = useState("");

  const { data: groups, isLoading, isError, refetch } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests-for-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["group-members", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("*, guest_groups!inner(event_id)")
        .eq("guest_groups.event_id", eventId);
      if (error) throw error;
      return (data ?? []) as (GuestGroupMember & { guest_groups: { event_id: string } })[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name, description: description || null })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({ event_id: eventId, name, description: description || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
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

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!managingGroup || !selectedGuest) return;
      const { error } = await supabase
        .from("guest_group_members")
        .insert({ group_id: managingGroup.id, guest_id: selectedGuest });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      setSelectedGuest("");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("guest_group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
    },
  });

  function resetForm() {
    setName("");
    setDescription("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(g: GuestGroup) {
    setEditing(g);
    setName(g.name);
    setDescription(g.description ?? "");
    setShowForm(true);
  }

  function getGroupMemberCount(groupId: string): number {
    return members?.filter((m) => m.group_id === groupId).length ?? 0;
  }

  function getGroupMembers(groupId: string) {
    return members?.filter((m) => m.group_id === groupId) ?? [];
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load groups." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Guest Groups</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for targeted invitations.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          Add Group
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-dash-text">
            {editing ? "Edit Group" : "New Group"}
          </h2>
          <div className="space-y-4">
            <Input
              label="Group name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bride's Family"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!name.trim() || saveMutation.isPending}
              >
                {editing ? "Update" : "Create"}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
            {saveMutation.isError && (
              <p className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
              </p>
            )}
          </div>
        </Card>
      )}

      {groups && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                    <Badge>{getGroupMemberCount(group.id)} guests</Badge>
                  </div>
                  {group.description && (
                    <p className="mt-1 text-sm text-dash-muted">{group.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setManagingGroup(group)}>
                    Manage
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(group)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Delete this group?")) {
                        deleteMutation.mutate(group.id);
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            title="No groups yet"
            description="Create groups to organize your guests."
            action={<Button onClick={() => setShowForm(true)}>Add Group</Button>}
          />
        )
      )}

      {/* Manage Members Modal */}
      <Modal
        open={!!managingGroup}
        onClose={() => setManagingGroup(null)}
        title={managingGroup ? `Manage: ${managingGroup.name}` : ""}
        size="lg"
      >
        {managingGroup && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={selectedGuest}
                onChange={(e) => setSelectedGuest(e.target.value)}
                className="flex-1"
              >
                <option value="">Select a guest…</option>
                {guests?.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
              <Button
                onClick={() => addMemberMutation.mutate()}
                loading={addMemberMutation.isPending}
                disabled={!selectedGuest || addMemberMutation.isPending}
              >
                Add
              </Button>
            </div>
            {addMemberMutation.isError && (
              <p className="text-sm text-dash-danger">
                {addMemberMutation.error instanceof Error ? addMemberMutation.error.message : "Failed to add member."}
              </p>
            )}

            <div className="space-y-2">
              {getGroupMembers(managingGroup.id).map((m) => {
                const guest = guests?.find((g) => g.id === m.guest_id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-dash-border px-3 py-2"
                  >
                    <span className="text-sm text-dash-text">{guest?.name ?? "Unknown"}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMemberMutation.mutate(m.id)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
              {getGroupMembers(managingGroup.id).length === 0 && (
                <p className="text-sm text-dash-muted">No members in this group yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
