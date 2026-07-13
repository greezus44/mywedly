import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card, Badge, EmptyState, FormField, Modal, useToast } from "../../components/ui";
import { formatDate, formatTime } from "../../lib/utils";

export default function EventsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "",
    venue: "",
    address: "",
    description: "",
    dress_code: "",
  });

  const { data: subEvents, isLoading } = useQuery({
    queryKey: ["sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_eventId", event.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orderIndex = (subEvents?.length ?? 0);
      const { error } = await supabase.from("sub_events").insert({
        parent_eventId: event.id,
        name: form.name,
        date: form.date || null,
        time: form.time || null,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: false,
        order_index: orderIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      toast("Sub-event created", "success");
      setAddOpen(false);
      setForm({ name: "", date: "", time: "", venue: "", address: "", description: "", dress_code: "" });
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      toast("Sub-event deleted", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sub-events</h2>
          <p className="text-sm text-gray-500">Manage individual events within your main event.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add sub-event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !subEvents || subEvents.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No sub-events"
            description="Add sub-events like ceremony, reception, etc."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add sub-event
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subEvents.map((se) => (
            <Card key={se.id} className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{se.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this sub-event?")) deleteMutation.mutate(se.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {se.date && (
                  <Badge variant="info">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(se.date)}
                  </Badge>
                )}
                {se.time && (
                  <Badge variant="info">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatTime(se.time)}
                  </Badge>
                )}
              </div>
              {se.venue && (
                <p className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {se.venue}
                </p>
              )}
              {se.description && <p className="mt-2 text-sm text-gray-500">{se.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add sub-event">
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
              placeholder="Ceremony"
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </FormField>
            <FormField label="Time">
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="Venue name"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Address"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
            />
          </FormField>
          <FormField label="Dress code">
            <Input
              value={form.dress_code}
              onChange={(e) => setForm((f) => ({ ...f, dress_code: e.target.value }))}
              placeholder="Black tie"
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
