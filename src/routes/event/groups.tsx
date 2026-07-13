import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";

export default function Groups() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");

  const { data: groups, isLoading, isError, refetch } = useQuery({
    queryKey: ["groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guest_groups").insert({
        event_id: event.id,
        wedding_id: event.id,
        name,
        sort_order: groups?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", event.id] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("guest_groups")
        .update({ name })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", event.id] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", event.id] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setShowModal(true);
  };

  const openEdit = (group: GuestGroup) => {
    setEditing(group);
    setName(group.name);
    setShowModal(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">Organize guests into groups for targeted invitations.</p>
        </div>
        <Button onClick={openCreate}>+ Add Group</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups like 'Bride's Family', 'Groom's Friends', etc."
          action={<Button onClick={openCreate}>+ Add Group</Button>}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-dash-text">{group.name}</h3>
                <p className="mt-0.5 text-xs text-dash-muted">Order: {group.sort_order}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(group)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(group.id)}
                  loading={deleteMutation.isPending}
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
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bride's Family"
        />
        {(createMutation.isError || updateMutation.isError) && (
          <p className="mt-2 text-sm text-dash-danger">
            {createMutation.error?.message || updateMutation.error?.message || "Failed"}
          </p>
        )}
      </Modal>
    </div>
  );
}
