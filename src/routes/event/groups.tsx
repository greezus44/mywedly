import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  Input,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";

export default function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: groups,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["groups", eventId],
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

  // Guest counts per group
  const { data: guestCounts } = useQuery({
    queryKey: ["group-guest-counts", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("group_id")
        .eq("event_id", eventId)
        .not("group_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const gid = row.group_id as string;
        counts[gid] = (counts[gid] ?? 0) + 1;
      }
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Group name is required.");
      const maxSort = groups?.reduce((max, g) => Math.max(max, g.sort_order), -1) ?? -1;
      const { error } = await supabase.from("guest_groups").insert({
        event_id: eventId,
        name: name.trim(),
        sort_order: maxSort + 1,
        wedding_id: eventId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guest-counts", eventId] });
      setShowModal(false);
      setName("");
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Group name is required.");
      const { error } = await supabase
        .from("guest_groups")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      setShowModal(false);
      setName("");
      setEditingId(null);
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guest-counts", eventId] });
    },
  });

  const openCreate = () => {
    setName("");
    setEditingId(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (group: GuestGroup) => {
    setName(group.name);
    setEditingId(group.id);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const mutationError = formError ?? (deleteMutation.error as Error | null)?.message;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Guest Groups</h1>
          <p className="text-sm text-dash-muted">
            Organize guests into groups for easier invitation management.
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Group</Button>
      </div>

      {mutationError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{mutationError}</p>
      )}

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups to organize your guests (e.g. Bride's side, Groom's side)."
          icon={<span className="text-4xl">👥</span>}
          action={<Button onClick={openCreate}>+ Add Group</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                <Badge variant="info" className="mt-1">
                  {guestCounts?.[group.id] ?? 0} guest{(guestCounts?.[group.id] ?? 0) !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(group)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"? Guests in this group will not be deleted.`)) {
                      deleteMutation.mutate(group.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Group" : "Add Group"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit} disabled={!name.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bride's Family"
          autoFocus
          error={formError ?? undefined}
        />
      </Modal>
    </div>
  );
}
