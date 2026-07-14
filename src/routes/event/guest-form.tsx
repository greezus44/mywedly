import React from "react";
import type { EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { cn } from "../../lib/utils";

export interface GuestFormFields {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  group_id: string;
  plus_ones: number;
  dietary: string;
  message: string;
  table_number: string;
  rsvp_status: string;
}

export function guestToForm(guest: EventGuest): GuestFormFields {
  return {
    name: guest.name ?? "",
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    group_id: guest.group_id ?? "",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    table_number: guest.table_number ?? "",
    rsvp_status: guest.rsvp_status ?? "",
  };
}

export function formToGuest(
  form: GuestFormFields
): Omit<EventGuest, "id" | "event_id" | "token" | "rsvp_submitted_at" | "created_at"> {
  return {
    name: form.name,
    username: form.username || null,
    email: form.email || null,
    phone: form.phone || null,
    group_name: form.group_name || null,
    side: form.side || null,
    group_id: form.group_id || null,
    plus_ones: form.plus_ones,
    dietary: form.dietary || null,
    message: form.message || null,
    table_number: form.table_number || null,
    rsvp_status: form.rsvp_status || null,
  };
}

interface RsvpBadgeProps {
  status: string | null;
  className?: string;
}

export function RsvpBadge({ status, className }: RsvpBadgeProps) {
  if (!status) return <Badge variant="default" className={className}>No Response</Badge>;
  const variant =
    status === "attending"
      ? "success"
      : status === "not_attending"
      ? "danger"
      : "warning";
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}

interface GuestFormProps {
  form: GuestFormFields;
  onChange: (patch: Partial<GuestFormFields>) => void;
  groups: { id: string; name: string }[];
}

export function GuestForm({ form, onChange, groups }: GuestFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Name"
        type="text"
        value={form.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Jane Doe"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Username"
          type="text"
          value={form.username}
          onChange={(e) => onChange({ username: e.target.value })}
          placeholder="janedoe"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="jane@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="555-1234"
        />
        <Input
          label="Table Number"
          type="text"
          value={form.table_number}
          onChange={(e) => onChange({ table_number: e.target.value })}
          placeholder="Table 1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Group"
          value={form.group_id}
          onChange={(e) => onChange({ group_id: e.target.value })}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <Select
          label="Side"
          value={form.side}
          onChange={(e) => onChange({ side: e.target.value })}
        >
          <option value="">No side</option>
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
          <option value="both">Both</option>
        </Select>
      </div>
      <Input
        label="Plus Ones"
        type="number"
        min={0}
        value={form.plus_ones}
        onChange={(e) => onChange({ plus_ones: Number(e.target.value) })}
      />
      <Input
        label="Dietary Requirements"
        type="text"
        value={form.dietary}
        onChange={(e) => onChange({ dietary: e.target.value })}
        placeholder="Vegetarian, gluten-free, etc."
      />
      <Textarea
        label="Message"
        value={form.message}
        onChange={(e) => onChange({ message: e.target.value })}
        placeholder="Optional message from guest..."
      />
      <Select
        label="RSVP Status"
        value={form.rsvp_status}
        onChange={(e) => onChange({ rsvp_status: e.target.value })}
      >
        <option value="">No response</option>
        <option value="attending">Attending</option>
        <option value="not_attending">Not Attending</option>
        <option value="pending">Pending</option>
      </Select>
    </div>
  );
}
