import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, FormField, Modal, Card, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const {
    data: groups,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const nextOrder = groups?.length ?? 0;
      const { error } = await supabase
        .from("guest_groups")
        .insert({
          event_id: eventId,
          name: groupName,
          sort_order: nextOrder,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setName("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, groupName }: { id: string; groupName: string }) => {
      const { error } = await supabase
        .from("guest_groups")
        .update({ name: groupName })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setEditingId(null);
      setName("");
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
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, groupName: name });
    } else {
      createMutation.mutate(name);
    }
  };

  const handleEdit = (group: GuestGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Guest Groups</h2>
        <Button
          onClick={() => {
            setName("");
            setEditingId(null);
            setShowForm(true);
          }}
        >
          Add Group
        </Button>
      </div>

      {groups && groups.length === 0 ? (
        <EmptyState
          title="No guest groups"
          description="Create groups to organize your guests (e.g. Bride's side, Groom's side)."
          action={
            <Button
              onClick={() => {
                setName("");
                setEditingId(null);
                setShowForm(true);
              }}
            >
              Add Group
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Card key={group.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-dash-text">
                    {group.name}
                  </h3>
                  <Badge className="mt-1">Group</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(group)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(group.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setName("");
        }}
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family"
            autoFocus
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600">Failed to save</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
