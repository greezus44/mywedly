import { useState, type FormEvent } from "react";
import { supabase, type EventGuest, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
  name: string; username: string; group_name: string; side: string;
  group_id: string | null; allow_plus_one: boolean;
  /** sub_event_id → invited? overrides */
  eventInvitations: Record<string, boolean>;
  /** sub_event_id → allow +1? overrides */
  plusOnePerEvent: Record<string, boolean>;
}

export function guestToForm(g: EventGuest): GuestFormValues {
  return { name: g.name ?? "", username: g.username ?? "", group_name: g.group_name ?? "", side: g.side ?? "", group_id: g.group_id ?? null, allow_plus_one: g.allow_plus_one ?? false, eventInvitations: {}, plusOnePerEvent: {} };
}

interface GuestFormProps {
  eventId: string;
  guest?: EventGuest | null;
  groups?: Array<{ id: string; name: string }>;
  subEvents?: SubEvent[];
  /** Existing invitation overrides for this guest: sub_event_id → is_invited */
  existingInvitations?: Record<string, boolean>;
  /** Existing +1-per-event overrides: sub_event_id → allow_plus_one */
  existingPlusOnePerEvent?: Record<string, boolean>;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GuestForm({ guest, groups, subEvents, existingInvitations, existingPlusOnePerEvent, onSubmit, onCancel, submitting }: GuestFormProps) {
  const [values, setValues] = useState<GuestFormValues>(() => guest ? guestToForm(guest) : { name: "", username: "", group_name: "", side: "", group_id: null, allow_plus_one: false, eventInvitations: {}, plusOnePerEvent: {} });
  const [error, setError] = useState<string | null>(null);

  // Initialize invitation and +1-per-event state from props
  const [invitedEvents, setInvitedEvents] = useState<Record<string, boolean>>(() => existingInvitations ?? {});
  const [plusOneEvents, setPlusOneEvents] = useState<Record<string, boolean>>(() => existingPlusOnePerEvent ?? {});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!values.name.trim()) { setError("Name is required"); return; }
    await onSubmit({ ...values, username: values.username.trim() || generateUsername(values.name), eventInvitations: invitedEvents, plusOnePerEvent: plusOneEvents });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Guest Name" value={values.name} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. John Smith" required autoFocus />
      <Input label="Username" value={values.username} onChange={(e) => setValues((p) => ({ ...p, username: e.target.value }))} placeholder="Auto-generated if left blank" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Group</label>
        <select value={values.group_id ?? ""} onChange={(e) => { const gid = e.target.value || null; const groupName = groups?.find((g) => g.id === gid)?.name ?? ""; setValues((p) => ({ ...p, group_id: gid, group_name: groupName })); }} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none">
          <option value="">No group</option>
          {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Side</label>
        <select value={values.side} onChange={(e) => setValues((p) => ({ ...p, side: e.target.value }))} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none">
          <option value="">None</option><option value="groom">Groom</option><option value="bride">Bride</option><option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-dash-text">
          <input type="checkbox" checked={values.allow_plus_one} onChange={(e) => setValues((p) => ({ ...p, allow_plus_one: e.target.checked }))} className="accent-dash-primary" />
          Allow +1 (applies to main event and events without per-event setting)
        </label>
      </div>

      {/* Per-event invitation overrides */}
      {subEvents && subEvents.length > 0 && (
        <div className="border-t border-dash-border pt-4">
          <p className="mb-2 text-sm font-medium text-dash-text">Event Invitations</p>
          <p className="mb-3 text-xs text-dash-muted">Override which events this guest is invited to. Group assignments act as defaults; individual selections here override the group for this guest only.</p>
          <div className="space-y-2">
            {subEvents.map((se) => (
              <div key={se.id} className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-dash-text">
                  <input type="checkbox" checked={invitedEvents[se.id] ?? false} onChange={(e) => { setInvitedEvents((p) => ({ ...p, [se.id]: e.target.checked })); if (!e.target.checked) setPlusOneEvents((p) => { const c = { ...p }; delete c[se.id]; return c; }); }} className="accent-dash-primary" />
                  {se.name}
                </label>
                {invitedEvents[se.id] && (
                  <label className="flex items-center gap-1.5 text-xs text-dash-muted">
                    <input type="checkbox" checked={plusOneEvents[se.id] ?? false} onChange={(e) => setPlusOneEvents((p) => ({ ...p, [se.id]: e.target.checked }))} className="accent-dash-primary" />
                    +1
                  </label>
                )}
              </div>
            ))}
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
