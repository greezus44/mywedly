import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { GuestForm, RsvpBadge, type GuestFormValues } from "./guest-form";
import { generateUsername } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function GuestsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<EventGuest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }),
  });

  const handleAddOrUpdate = async (values: GuestFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editGuest) {
        // FIX #1: use `name` column (not `full_name`)
        const { error } = await supabase
          .from("event_guests")
          .update({
            name: values.name,
            username: values.username,
            group_name: values.group_name,
            side: values.side,
            group_id: values.group_id,
          })
          .eq("id", editGuest.id);
        if (error) throw error;
      } else {
        // FIX #1: use `name` column (not `full_name`)
        const { error } = await supabase
          .from("event_guests")
          .insert({
            event_id: eventId,
            name: values.name,
            username: values.username || generateUsername(values.name),
            group_name: values.group_name,
            side: values.side,
            group_id: values.group_id,
            token: crypto.randomUUID(),
            rsvp_status: "pending",
            plus_ones: 0,
          });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowForm(false);
      setEditGuest(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save guest");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load guests" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
        <Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>
      </div>

      {!guests || guests.length === 0 ? (
        <EmptyState title="No guests yet" description="Add guests to invite them to your event." action={<Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-dash-border">
          <table className="w-full">
            <thead className="bg-dash-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Username</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Group</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">RSVP</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {guests.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2 text-sm text-dash-text">{g.name}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{g.group_name ?? "—"}</td>
                  <td className="px-4 py-2"><RsvpBadge status={g.rsvp_status} /></td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => { setEditGuest(g); setShowForm(true); }} className="mr-2 text-xs text-dash-primary hover:underline">Edit</button>
                    <button onClick={() => deleteMutation.mutate(g.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditGuest(null); setFormError(null); }} title={editGuest ? "Edit Guest" : "Add Guest"}>
        {formError && <p className="mb-3 text-sm text-dash-danger">{formError}</p>}
        <GuestForm
          eventId={eventId}
          guest={editGuest}
          groups={groups ?? []}
          onSubmit={handleAddOrUpdate}
          onCancel={() => { setShowForm(false); setEditGuest(null); setFormError(null); }}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
}
