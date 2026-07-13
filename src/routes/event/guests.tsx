import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, Loader2, Users } from "lucide-react";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, EmptyState, FormField, Modal, useToast } from "../../components/ui";

const rsvpVariants: Record<string, "success" | "error" | "warning" | "default"> = {
  attending: "success",
  declined: "error",
  pending: "warning",
};

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", group_name: "", side: "" });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["event-guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_guests").insert({
        event_id: event.id,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        group_name: form.group_name || null,
        side: form.side || null,
        rsvp_status: "pending",
        plus_ones: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", event.id] });
      toast("Guest added", "success");
      setAddOpen(false);
      setForm({ name: "", email: "", phone: "", group_name: "", side: "" });
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", event.id] });
      toast("Guest removed", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const filtered = (guests ?? []).filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Guests</h2>
          <p className="text-sm text-gray-500">{guests?.length ?? 0} total guests</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add guest
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={search ? "No guests found" : "No guests yet"}
            description={search ? "Try a different search." : "Add your first guest to get started."}
            action={
              !search ? (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add guest
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Group</th>
                <th className="px-4 py-2 font-medium">RSVP</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{g.name}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {g.email && <div>{g.email}</div>}
                    {g.phone && <div className="text-xs text-gray-400">{g.phone}</div>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{g.group_name || "—"}</td>
                  <td className="px-4 py-2">
                    <Badge variant={rsvpVariants[g.rsvp_status]}>{g.rsvp_status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Remove ${g.name}?`)) deleteMutation.mutate(g.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add guest">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <FormField label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe"
              required
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Group">
              <Input
                value={form.group_name}
                onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))}
                placeholder="Family"
              />
            </FormField>
            <FormField label="Side">
              <Input
                value={form.side}
                onChange={(e) => setForm((f) => ({ ...f, side: e.target.value }))}
                placeholder="Bride / Groom"
              />
            </FormField>
          </div>
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
