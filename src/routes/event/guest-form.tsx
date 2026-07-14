import React from "react";
import type { EventGuest } from "../../lib/supabase";
import { Input, Textarea, Select, FormField } from "../../components/ui";
import { Badge } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormFields {
  name: string;
  username: string;
  email: string;
  phone: string;
  side: string;
  group_id: string;
  group_name: string;
  table_number: string;
  dietary: string;
  message: string;
}

export function guestToForm(guest: EventGuest): GuestFormFields {
  return {
    name: guest.name ?? "",
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    side: guest.side ?? "",
    group_id: guest.group_id ?? "",
    group_name: guest.group_name ?? "",
    table_number: guest.table_number ?? "",
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
  };
}

export function emptyGuestForm(): GuestFormFields {
  return {
    name: "",
    username: "",
    email: "",
    phone: "",
    side: "",
    group_id: "",
    group_name: "",
    table_number: "",
    dietary: "",
    message: "",
  };
}

interface RsvpBadgeProps {
  status: string | null;
}

export function RsvpBadge({ status }: RsvpBadgeProps) {
  switch (status) {
    case "attending":
      return <Badge color="success">Attending</Badge>;
    case "not_attending":
      return <Badge color="danger">Not Attending</Badge>;
    case "pending":
      return <Badge color="warning">Pending</Badge>;
    default:
      return <Badge color="default">No Response</Badge>;
  }
}

interface GuestFormProps {
  form: GuestFormFields;
  setForm: (form: GuestFormFields) => void;
  groups: { id: string; name: string }[];
}

export function GuestForm({ form, setForm, groups }: GuestFormProps) {
  const handleNameBlur = () => {
    // Auto-generate username if empty
    if (!form.username && form.name.trim()) {
      setForm({ ...form, username: generateUsername(form.name) });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Guest Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        onBlur={handleNameBlur}
        placeholder="Full name"
        required
      />
      <Input
        label="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="auto-generated from name"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="guest@example.com"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone number"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Side"
          value={form.side}
          onChange={(e) => setForm({ ...form, side: e.target.value })}
        >
          <option value="">No side</option>
          <option value="bride">Bride's Side</option>
          <option value="groom">Groom's Side</option>
          <option value="both">Both</option>
        </Select>
        <Select
          label="Guest Group"
          value={form.group_id}
          onChange={(e) => {
            const selectedGroup = groups.find((g) => g.id === e.target.value);
            setForm({
              ...form,
              group_id: e.target.value,
              group_name: selectedGroup?.name ?? "",
            });
          }}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      <Input
        label="Table Number"
        value={form.table_number}
        onChange={(e) => setForm({ ...form, table_number: e.target.value })}
        placeholder="e.g. 5"
      />
      <Textarea
        label="Dietary Requirements"
        value={form.dietary}
        onChange={(e) => setForm({ ...form, dietary: e.target.value })}
        rows={2}
        placeholder="Allergies, preferences, etc."
      />
      <Textarea
        label="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        rows={2}
        placeholder="Note about this guest"
      />
    </div>
  );
}
