import React from "react";
import { type EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";
import { Input, Textarea, Select } from "../../components/ui/Input";

export interface GuestFormValues {
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  group_id: string | null;
  side: string | null;
  table_number: string | null;
  rsvp_status: string | null;
  plus_ones: number | null;
  dietary: string | null;
  message: string | null;
}

export function guestToForm(guest: EventGuest | null): GuestFormValues {
  if (!guest) {
    return {
      name: "",
      username: null,
      email: null,
      phone: null,
      group_id: null,
      side: null,
      table_number: null,
      rsvp_status: null,
      plus_ones: null,
      dietary: null,
      message: null,
    };
  }
  return {
    name: guest.name ?? "",
    username: guest.username,
    email: guest.email,
    phone: guest.phone,
    group_id: guest.group_id,
    side: guest.side,
    table_number: guest.table_number,
    rsvp_status: guest.rsvp_status,
    plus_ones: guest.plus_ones,
    dietary: guest.dietary,
    message: guest.message,
  };
}

export function RsvpBadge({ status }: { status: string | null }) {
  if (!status || status === "pending") {
    return <Badge color="warning">Pending</Badge>;
  }
  if (status === "attending") {
    return <Badge color="success">Attending</Badge>;
  }
  if (status === "not_attending") {
    return <Badge color="danger">Not Attending</Badge>;
  }
  return <Badge color="default">{status}</Badge>;
}

interface GuestFormProps {
  values: GuestFormValues;
  onChange: (values: GuestFormValues) => void;
  groups: { id: string; name: string }[];
}

export function GuestForm({ values, onChange, groups }: GuestFormProps) {
  const update = (patch: Partial<GuestFormValues>) => {
    onChange({ ...values, ...patch });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={values.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Full name"
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Username"
          value={values.username ?? ""}
          onChange={(e) => update({ username: e.target.value || null })}
          placeholder="guest123"
        />
        <Input
          label="Email"
          type="email"
          value={values.email ?? ""}
          onChange={(e) => update({ email: e.target.value || null })}
          placeholder="guest@example.com"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Phone"
          value={values.phone ?? ""}
          onChange={(e) => update({ phone: e.target.value || null })}
          placeholder="+1 234 567 8900"
        />
        <Select
          label="Group"
          value={values.group_id ?? ""}
          onChange={(e) => update({ group_id: e.target.value || null })}
        >
          <option value="">No Group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Side"
          value={values.side ?? ""}
          onChange={(e) => update({ side: e.target.value || null })}
        >
          <option value="">No Side</option>
          <option value="bride">Bride's Side</option>
          <option value="groom">Groom's Side</option>
          <option value="both">Both</option>
          <option value="other">Other</option>
        </Select>
        <Input
          label="Table Number"
          value={values.table_number ?? ""}
          onChange={(e) => update({ table_number: e.target.value || null })}
          placeholder="e.g. 5"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="RSVP Status"
          value={values.rsvp_status ?? ""}
          onChange={(e) => update({ rsvp_status: e.target.value || null })}
        >
          <option value="">Pending</option>
          <option value="attending">Attending</option>
          <option value="not_attending">Not Attending</option>
        </Select>
        <Input
          label="Plus Ones"
          type="number"
          min={0}
          value={values.plus_ones ?? ""}
          onChange={(e) =>
            update({ plus_ones: e.target.value ? parseInt(e.target.value, 10) : null })
          }
          placeholder="0"
        />
      </div>

      <Textarea
        label="Dietary Requirements"
        value={values.dietary ?? ""}
        onChange={(e) => update({ dietary: e.target.value || null })}
        placeholder="e.g. Vegetarian, Gluten-free"
        rows={2}
      />

      <Textarea
        label="Message"
        value={values.message ?? ""}
        onChange={(e) => update({ message: e.target.value || null })}
        placeholder="Guest's message"
        rows={2}
      />
    </div>
  );
}
