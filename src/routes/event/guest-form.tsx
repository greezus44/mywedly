import { useState, type FormEvent } from "react";
import { supabase, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
  name: string;
  username: string;
  group_name: string;
  side: string;
  group_id: string | null;
}

export function guestToForm(g: EventGuest): GuestFormValues {
  return {
    name: g.name ?? "",
    username: g.username ?? "",
    group_name: g.group_name ?? "",
    side: g.side ?? "",
    group_id: g.group_id ?? null,
  };
}

interface GuestFormProps {
  eventId: string;
  guest?: EventGuest | null;
  groups?: Array<{ id: string; name: string }>;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GuestForm({ eventId, guest, groups, onSubmit, onCancel, submitting }: GuestFormProps) {
  const [values, setValues] = useState<GuestFormValues>(() =>
    guest ? guestToForm(guest) : { name: "", username: "", group_name: "", side: "", group_id: null },
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    // Auto-generate username if empty
    const finalValues: GuestFormValues = {
      ...values,
      username: values.username.trim() || generateUsername(values.name),
    };
    await onSubmit(finalValues);
  };

  // FIX #5: Email, Phone, Table fields removed — only Name, Username, Group, Side remain
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Guest Name"
        value={values.name}
        onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
        placeholder="e.g. John Smith"
        required
        autoFocus
      />
      <Input
        label="Username"
        value={values.username}
        onChange={(e) => setValues((p) => ({ ...p, username: e.target.value }))}
        placeholder="Auto-generated if left blank"
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Group</label>
        <select
          value={values.group_id ?? ""}
          onChange={(e) => {
            const gid = e.target.value || null;
            const groupName = groups?.find((g) => g.id === gid)?.name ?? "";
            setValues((p) => ({ ...p, group_id: gid, group_name: groupName }));
          }}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none"
        >
          <option value="">No group</option>
          {(groups ?? []).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Side</label>
        <select
          value={values.side}
          onChange={(e) => setValues((p) => ({ ...p, side: e.target.value }))}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:border-dash-primary focus:outline-none"
        >
          <option value="">None</option>
          <option value="groom">Groom</option>
          <option value="bride">Bride</option>
          <option value="other">Other</option>
        </select>
      </div>
      {error && <p className="text-sm text-dash-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>{guest ? "Update" : "Add"} Guest</Button>
      </div>
    </form>
  );
}

export function RsvpBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    attending: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
