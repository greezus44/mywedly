import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";

async function fetchGroups(eventId: string): Promise<GuestGroup[]> {
  const { data, error } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as GuestGroup[];
}

async function createGroup(
  eventId: string,
  name: string,
  sortOrder: number
): Promise<void> {
  const { error } = await supabase.from("guest_groups").insert({
    event_id: eventId,
    name,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

async function updateGroup(
  id: string,
  name: string,
  sortOrder: number
): Promise<void> {
  const { error } = await supabase
    .from("guest_groups")
    .update({ name, sort_order: sortOrder })
    .eq("id", id);
  if (error) throw error;
}

async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("guest_groups").delete().eq("id", id);
  if (error) throw error;
}

async function fetchGroupGuestCounts(
  eventId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("event_guests")
    .select("group_id")
    .eq("event_id", eventId)
    .not("group_id", "is", null);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ group_id: string | null }>) {
    if (row.group_id) {
      counts[row.group_id] = (counts[row.group_id] ?? 0) + 1;
    }
  }
  return counts;
}

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const { data: guestCounts } = useQuery({
    queryKey: ["group-guest-counts", eventId],
    queryFn: () => fetchGroupGuestCounts(eventId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      if (!name.trim()) {
        setError("Group name is required");
        throw new Error("Name required");
      }
      if (editingGroup) {
        await updateGroup(editingGroup.id, name.trim(), editingGroup.sort_order);
      } else {
        await createGroup(eventId, name.trim(), groups?.length ?? 0);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      setShowModal(false);
      setEditingGroup(null);
      setName("");
    },
    onError: (err: Error) => {
      if (err.message !== "Name required") {
        setError(err.message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guest-counts", eventId] });
    },
  });

  const openCreate = () => {
    setEditingGroup(null);
    setName("");
    setError(null);
    setShowModal(true);
  };

  const openEdit = (group: GuestGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setError(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
          <p className="text-sm text-dash-muted">
            Organize your guests into groups for easier management
          </p>
        </div>
        <Button onClick={openCreate}>Add group</Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <ErrorState
          title="Failed to load groups"
          description={queryError instanceof Error ? queryError.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {groups && groups.length === 0 && (
        <EmptyState
          title="No guest groups"
          description="Create groups to organize your guests (e.g. Family, Friends, Colleagues)."
          action={<Button onClick={openCreate}>Add group</Button>}
        />
      )}

      {groups && groups.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-dash-text truncate">
                    {group.name}
                  </h3>
                  <p className="text-sm text-dash-muted mt-1">
                    {guestCounts?.[group.id] ?? 0} guest
                    {(guestCounts?.[group.id] ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(group)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${group.name}"? Guests in this group will not be deleted.`)) {
                        deleteMutation.mutate(group.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family, Friends, Colleagues"
            autoFocus
            error={error ?? undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!name.trim()}
            >
              {editingGroup ? "Save changes" : "Add group"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
