import { useState, useEffect, type FormEvent } from "react";
import { type EventGuest, type EventRsvp, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField } from "../../components/ui";
import { Badge, type BadgeVariant } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormProps {
  guest?: EventGuest | null;
  onSubmit: (values: GuestFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export interface GuestFormValues {
  name: string;
  email: string | null;
  phone: string | null;
  username: string;
  plus_one_allowed: boolean;
  plus_one_count: number;
  notes: string | null;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    username: guest.username,
    plus_one_allowed: guest.plus_one_allowed,
    plus_one_count: guest.plus_one_count,
    notes: guest.notes,
  };
}

export function GuestForm({ guest, onSubmit, onCancel, isPending }: GuestFormProps) {
  const [name, setName] = useState(guest?.name || "");
  const [email, setEmail] = useState(guest?.email || "");
  const [phone, setPhone] = useState(guest?.phone || "");
  const [username, setUsername] = useState(guest?.username || "");
  const [plusOneAllowed, setPlusOneAllowed] = useState(guest?.plus_one_allowed ?? false);
  const [plusOneCount, setPlusOneCount] = useState(guest?.plus_one_count ?? 0);
  const [notes, setNotes] = useState(guest?.notes || "");
  const [error, setError] = useState<string | null>(null);

  // Auto-generate username from name when creating a new guest
  useEffect(() => {
    if (!guest && name.trim() && !username) {
      setUsername(generateUsername(name));
    }
  }, [name, username, guest]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      username: username.trim(),
      plus_one_allowed: plusOneAllowed,
      plus_one_count: plusOneCount,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Guest name"
        required
        autoFocus
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="guest@example.com"
      />
      <Input
        label="Phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 555 000 0000"
      />
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username for guest login"
        required
      />
      <p className="-mt-2 text-xs text-dash-muted">Used by the guest to sign in to the event site.</p>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={plusOneAllowed}
            onChange={(e) => setPlusOneAllowed(e.target.checked)}
            className="h-4 w-4 rounded border-dash-border text-dash-primary focus:ring-dash-primary"
          />
          <span className="text-sm text-dash-text">Plus one allowed</span>
        </label>
        {plusOneAllowed && (
          <Input
            type="number"
            value={plusOneCount}
            onChange={(e) => setPlusOneCount(Number(e.target.value))}
            min={0}
            className="w-24"
            label=""
          />
        )}
      </div>

      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal notes about this guest"
        rows={3}
      />

      {error && <p className="text-sm text-dash-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isPending}>
          {guest ? "Save Changes" : "Add Guest"}
        </Button>
      </div>
    </form>
  );
}

export type RsvpStatus = EventRsvp["status"];

export interface RsvpBadgeProps {
  status: RsvpStatus;
}

const rsvpBadgeConfig: Record<RsvpStatus, { label: string; variant: BadgeVariant }> = {
  attending: { label: "Attending", variant: "success" },
  not_attending: { label: "Not Attending", variant: "danger" },
  maybe: { label: "Maybe", variant: "warning" },
  no_response: { label: "No Response", variant: "default" },
};

export function RsvpBadge({ status }: RsvpBadgeProps) {
  const config = rsvpBadgeConfig[status] || rsvpBadgeConfig.no_response;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function rsvpStatusFromJson(rsvp: EventRsvp | null | undefined): RsvpStatus {
  if (!rsvp) return "no_response";
  return rsvp.status;
}

export function getRsvpCounts(rsvps: EventRsvp[]): {
  attending: number;
  not_attending: number;
  maybe: number;
  no_response: number;
  total: number;
} {
  const counts = { attending: 0, not_attending: 0, maybe: 0, no_response: 0, total: rsvps.length };
  for (const r of rsvps) {
    if (r.status in counts) {
      counts[r.status]++;
    }
  }
  return counts;
}

export function getPlusOneCount(rsvps: EventRsvp[]): number {
  return rsvps.filter((r) => r.plus_one).length;
}

export function getSubEventAttendance(rsvp: EventRsvp): Record<string, boolean> {
  const att = rsvp.sub_event_attendance as Json | null;
  if (!att || typeof att !== "object" || Array.isArray(att)) return {};
  return att as Record<string, boolean>;
}
