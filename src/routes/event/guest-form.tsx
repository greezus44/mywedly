import { useState, useEffect, type FormEvent } from "react";
import { type EventGuest, type SubEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
  name: string; username: string; groupId: string | null;
  /** sub_event_id → invited? */
  eventInvitations: Record<string, boolean>;
}

export function guestToForm(g: EventGuest): GuestFormValues {
  return { name: g.name ?? "", username: g.username ?? "", groupId: g.group_id ?? null, eventInvitations: {} };
}

interface GuestFormProps {
  eventId: string;
  guest?: EventGuest | null;
  subEvents?: SubEvent[];
  groups?: GuestGroup[];
  /** Existing invitation state for this guest: sub_event_id → is_invited */
  existingInvitations?: Record<string, boolean>;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GuestForm({ guest, subEvents, groups, existingInvitations, onSubmit, onCancel, submitting }: GuestFormProps) {
  const [values, setValues] = useState<GuestFormValues>(() => guest ? guestToForm(guest) : { name: "", username: "", groupId: null, eventInvitations: {} });
  const [error, setError] = useState<string | null>(null);
  const [usernameTouched, setUsernameTouched] = useState(!!guest);

  const [invitedEvents, setInvitedEvents] = useState<Record<string, boolean>>(() => existingInvitations ?? {});

  // Sync invitation ticks when the existingInvitations data arrives (async)
  useEffect(() => {
    if (existingInvitations) setInvitedEvents(existingInvitations);
  }, [existingInvitations]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValues((p) => ({ ...p, name, username: usernameTouched ? p.username : name }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsernameTouched(true);
    setValues((p) => ({ ...p, username: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!values.name.trim()) { setError("Name is required"); return; }
    await onSubmit({ ...values, username: values.username.trim() || generateUsername(values.name), groupId: values.groupId || null, eventInvitations: invitedEvents });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Guest Name" value={values.name} onChange={handleNameChange} placeholder="e.g. John Smith" required autoFocus />
      <Input label="Username" value={values.username} onChange={handleUsernameChange} placeholder="Auto-filled with guest name" />
      {groups && groups.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-dash-muted">Group</label>
          <select value={values.groupId ?? ""} onChange={(e) => setValues((p) => ({ ...p, groupId: e.target.value || null }))} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text">
            <option value="">Ungrouped</option>
            {groups.map((gr) => <option key={gr.id} value={gr.id}>{gr.name}</option>)}
          </select>
        </div>
      )}

      {subEvents && subEvents.length > 0 && (
        <div className="border-t border-dash-border pt-4">
          <p className="mb-2 text-sm font-medium text-dash-text">Direct Event Invitations</p>
          <p className="mb-3 text-xs text-dash-muted">Tick which events this guest is directly invited to. If their group is invited to an event via Manage Invitations, they will also have access to that event regardless of these ticks.</p>
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
