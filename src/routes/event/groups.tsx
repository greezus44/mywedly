import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  EmptyState,
  LoadingSpinner,
  ErrorState,
  Badge,
} from "../../components/ui";

export default function GroupsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: groups, isLoading, isError, error } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guestCounts } = useQuery({
    queryKey: ["guest-counts-by-group", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("group_id")
        .eq("event_id", eventId)
        .not("group_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((g) => {
        if (g.group_id) counts[g.group_id] = (counts[g.group_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guest_groups").insert({
        event_id: eventId,
        wedding_id: eventId,
        name,
        sort_order: sortOrder || (groups?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-counts-by-group", eventId] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("guest_groups")
        .update({ name, sort_order: sortOrder })
        .eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-counts-by-group", eventId] });
    },
  });

  function openCreate() {
    setEditing(null);
    setName("");
    setSortOrder(groups?.length ?? 0);
    setShowModal(true);
  }

  function openEdit(group: GuestGroup) {
    setEditing(group);
    setName(group.name);
    setSortOrder(group.sort_order);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const saveError = editing ? updateMutation.error : createMutation.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message={error?.message} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for {event.name}.
          </p>
        </div>
        <Button onClick={openCreate}>Add Group</Button>
      </div>

      {groups && groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups like 'Family', 'Friends', or 'Colleagues' to organize your guests."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      ) : (
        <div className="space-y-3">
          {groups?.map((group) => (
            <Card key={group.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dash-bg text-dash-muted">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {guestCounts?.[group.id] ?? 0} guests
                    </Badge>
                    <span className="text-xs text-dash-muted">Order: {group.sort_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(group)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(group.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family, Friends, Colleagues"
            required
            autoFocus
          />
          <Input
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
          />
          {saveError && (
            <p className="text-sm text-red-600">
              {saveError instanceof Error ? saveError.message : "Save failed."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
