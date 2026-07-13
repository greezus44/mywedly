import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Users } from "lucide-react";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, EmptyState, FormField, Modal, useToast } from "../../components/ui";

export default function GroupsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: groups, isLoading } = useQuery({
    queryKey: ["guest-groups", event.id],
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
        name,
        sort_order: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", event.id] });
      toast("Group created", "success");
      setAddOpen(false);
      setName("");
    },
    onError: (err: Error) => {
      const msg = err.message.includes("row-level security")
        ? "You don't have permission to create groups for this event."
        : err.message.includes("JWT")
        ? "Your session has expired. Please sign in again."
        : `Unable to create the group: ${err.message}`;
      toast(msg, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", event.id] });
      toast("Group deleted", "success");
    },
    onError: (err: Error) => {
      const msg = err.message.includes("row-level security")
        ? "You don't have permission to delete groups for this event."
        : `Unable to delete the group: ${err.message}`;
      toast(msg, "error");
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
          <p className="text-sm text-gray-500">Organize guests into groups for easier management.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add group
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !groups || groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create groups like Family, Friends, Colleagues to organize guests."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add group
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-gray-900">{g.name}</h3>
                <p className="text-xs text-gray-400">Order: {g.sort_order}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Delete group "${g.name}"?`)) deleteMutation.mutate(g.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add group">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <FormField label="Group name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Family"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
