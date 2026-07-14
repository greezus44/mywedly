import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button, Card, LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { Input } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function InvitationManager() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("created_at", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });

  const createInvitation = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId, name: name.trim(), username: username.trim() || generateUsername(name), email: email || null,
        token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); setShowForm(false); setName(""); setUsername(""); setEmail("");
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to create invitation"); }
    finally { setSubmitting(false); }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_guests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load invitations" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-dash-text">Invitations</h2><Button size="sm" onClick={() => setShowForm(true)}>Add Invitation</Button></div>
      {!guests || guests.length === 0 ? (
        <EmptyState title="No invitations yet" description="Add guests to send them invitations." action={<Button size="sm" onClick={() => setShowForm(true)}>Add Invitation</Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-dash-border">
          <table className="w-full">
            <thead className="bg-dash-bg"><tr><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Name</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Username</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Email</th><th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">RSVP</th><th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th></tr></thead>
            <tbody className="divide-y divide-dash-border bg-dash-surface">
              {guests.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2 text-sm text-dash-text">{g.name}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{g.email ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-dash-muted">{g.rsvp_status}</td>
                  <td className="px-4 py-2 text-right"><button onClick={() => deleteMutation.mutate(g.id)} className="text-xs text-dash-danger hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showForm} onClose={() => { setShowForm(false); setFormError(null); }} title="Add Invitation">
        <form onSubmit={createInvitation} className="space-y-4">
          <Input label="Guest Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Auto-generated if blank" />
          <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {formError && <p className="text-sm text-dash-danger">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setShowForm(false); setFormError(null); }}>Cancel</Button><Button type="submit" loading={submitting}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
