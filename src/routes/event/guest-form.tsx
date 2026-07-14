import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import { Badge } from "../../components/ui";
import type { EventGuest } from "../../lib/supabase";

export interface GuestFormFields {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  group_id: string;
  rsvp_status: string;
  plus_ones: number;
  dietary: string;
  message: string;
  table_number: string;
}

export function guestToForm(guest: EventGuest | null): GuestFormFields {
  if (!guest) {
    return {
      name: "",
      username: "",
      email: "",
      phone: "",
      group_name: "",
      side: "",
      group_id: "",
      rsvp_status: "pending",
      plus_ones: 0,
      dietary: "",
      message: "",
      table_number: "",
    };
  }
  return {
    name: guest.name ?? "",
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    group_id: guest.group_id ?? "",
    rsvp_status: guest.rsvp_status ?? "pending",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    table_number: guest.table_number ?? "",
  };
}

export function RsvpBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700 border-green-200",
    yes: "bg-green-100 text-green-700 border-green-200",
    declined: "bg-red-100 text-red-700 border-red-200",
    no: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    maybe: "bg-blue-100 text-blue-700 border-blue-200",
  };
  const labels: Record<string, string> = {
    confirmed: "Confirmed",
    yes: "Yes",
    declined: "Declined",
    no: "No",
    pending: "Pending",
    maybe: "Maybe",
  };
  const style = styles[status] ?? styles.pending;
  const label = labels[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}

export function GuestForm({
  fields,
  onChange,
  groups,
}: {
  fields: GuestFormFields;
  onChange: (fields: GuestFormFields) => void;
  groups: { id: string; name: string }[];
}) {
  const update = (patch: Partial<GuestFormFields>) => {
    onChange({ ...fields, ...patch });
  };

  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={fields.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="e.g. Jane Doe"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Username"
          value={fields.username}
          onChange={(e) => update({ username: e.target.value })}
          placeholder="e.g. janedoe"
        />
        <Select
          label="RSVP Status"
          value={fields.rsvp_status}
          onChange={(e) => update({ rsvp_status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="maybe">Maybe</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={fields.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="jane@example.com"
        />
        <Input
          label="Phone"
          value={fields.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+1 234 567 890"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Guest Group"
          value={fields.group_id}
          onChange={(e) => update({ group_id: e.target.value })}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Input
          label="Side"
          value={fields.side}
          onChange={(e) => update({ side: e.target.value })}
          placeholder="e.g. Bride / Groom"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Plus ones"
          type="number"
          min={0}
          value={fields.plus_ones}
          onChange={(e) => update({ plus_ones: parseInt(e.target.value) || 0 })}
        />
        <Input
          label="Table number"
          value={fields.table_number}
          onChange={(e) => update({ table_number: e.target.value })}
          placeholder="e.g. 5"
        />
      </div>
      <Textarea
        label="Dietary requirements"
        value={fields.dietary}
        onChange={(e) => update({ dietary: e.target.value })}
        placeholder="e.g. Vegetarian, gluten-free..."
      />
      <Textarea
        label="Message"
        value={fields.message}
        onChange={(e) => update({ message: e.target.value })}
        placeholder="Guest message..."
      />
    </div>
  );
}
