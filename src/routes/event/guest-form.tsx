import { useState, type FormEvent } from "react";
import { type EventGuest, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
  name: string; username: string;
  /** sub_event_id → invited? */
  eventInvitations: Record<string, boolean>;
}

export function guestToForm(g: EventGuest): GuestFormValues {
  return { name: g.name ?? "", username: g.username ?? "", eventInvitations: {} };
}

interface GuestFormProps {
  eventId: string;
  guest?: EventGuest | null;
  subEvents?: SubEvent[];
  /** Existing invitation overrides for this guest: sub_event_id → is_invited */
  existingInvitations?: Record<string, boolean>;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GuestForm({ guest, subEvents, existingInvitations, onSubmit, onCancel, submitting }: GuestFormProps) {
  const [values, setValues] = useState<GuestFormValues>(() => guest ? guestToForm(guest) : { name: "", username: "", eventInvitations: {} });
  const [error, setError] = useState<string | null>(null);

  const [invitedEvents, setInvitedEvents] = useState<Record<string, boolean>>(() => existingInvitations ?? {});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!values.name.trim()) { setError("Name is required"); return; }
    await onSubmit({ ...values, username: values.username.trim() || generateUsername(values.name), eventInvitations: invitedEvents });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Guest Name" value={values.name} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. John Smith" required autoFocus />
      <Input label="Username" value={values.username} onChange={(e) => setValues((p) => ({ ...p, username: e.target.value }))} placeholder="Auto-generated if left blank" />

      {subEvents && subEvents.length > 0 && (
        <div className="border-t border-dash-border pt-4">
          <p className="mb-2 text-sm font-medium text-dash-text">Event Invitations</p>
          <p className="mb-3 text-xs text-dash-muted">Tick which events this guest is invited to.</p>
          <div className="space-y-2">
            {subEvents.map((se) => {
              const isInvited = invitedEvents[se.id] ?? false;
              return (
                <div key={se.id} className="rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
                  <label className="flex items-center gap-2 text-sm text-dash-text">
                    <input type="checkbox" checked={isInvited} onChange={(e) => setInvitedEvents((p) => ({ ...p, [se.id]: e.target.checked }))} className="accent-dash-primary" />
                    {se.name}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-dash-danger">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={submitting}>{guest ? "Update" : "Add"} Guest</Button></div>
    </form>
  );
}

export function RsvpBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { pending: "bg-gray-100 text-gray-700", attending: "bg-green-100 text-green-700", declined: "bg-red-100 text-red-700" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}
