import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Badge } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
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

export function guestToForm(guest: EventGuest): GuestFormValues {
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
    rsvp_status: guest.rsvp_status ?? "pending",
  };
}

export function emptyGuestForm(): GuestFormValues {
  return {
    name: "",
    username: "",
    email: "",
    phone: "",
    group_name: "",
    side: "",
    group_id: "",
    plus_ones: 0,
    dietary: "",
    message: "",
    table_number: "",
    rsvp_status: "pending",
  };
}

const RSVP_STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success",
  declined: "danger",
  pending: "warning",
  no_response: "warning",
  maybe: "default",
};

const RSVP_STATUS_LABELS: Record<string, string> = {
  attending: "Attending",
  declined: "Declined",
  pending: "Pending",
  no_response: "No Response",
  maybe: "Maybe",
};

export function RsvpBadge({ status }: { status: string }) {
  return (
    <Badge variant={RSVP_STATUS_VARIANTS[status] ?? "default"}>
      {RSVP_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

interface GuestFormProps {
  eventId: string;
  initial?: GuestFormValues;
  onSubmit: (values: GuestFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const SIDES = ["", "Bride", "Groom", "Both", "Family", "Friend"];

export function GuestForm({
  eventId,
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: GuestFormProps) {
  const [form, setForm] = useState<GuestFormValues>(initial ?? emptyGuestForm());

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  function update<K extends keyof GuestFormValues>(key: K, val: GuestFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleNameChange(name: string) {
    update("name", name);
    if (!form.username) {
      update("username", generateUsername(name));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Guest name"
        />
        <Input
          label="Username"
          value={form.username}
          onChange={(e) => update("username", e.target.value)}
          placeholder="auto-generated"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="guest@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+1 234 567 890"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Group"
          value={form.group_id}
          onChange={(e) => update("group_id", e.target.value)}
        >
          <option value="">No group</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Select
          label="Side"
          value={form.side}
          onChange={(e) => update("side", e.target.value)}
        >
          {SIDES.map((s) => (
            <option key={s} value={s}>{s || "—"}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Plus Ones"
          type="number"
          min={0}
          value={form.plus_ones}
          onChange={(e) => update("plus_ones", Number(e.target.value))}
        />
        <Input
          label="Table Number"
          value={form.table_number}
          onChange={(e) => update("table_number", e.target.value)}
          placeholder="e.g. 5"
        />
        <Select
          label="RSVP Status"
          value={form.rsvp_status}
          onChange={(e) => update("rsvp_status", e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="maybe">Maybe</option>
          <option value="no_response">No Response</option>
        </Select>
      </div>

      <Input
        label="Dietary Requirements"
        value={form.dietary}
        onChange={(e) => update("dietary", e.target.value)}
        placeholder="e.g. Vegetarian, Gluten-free"
      />

      <Textarea
        label="Message"
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
        placeholder="Guest message or notes..."
        rows={2}
      />

      {error && (
        <p className="text-sm text-dash-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save Guest
        </Button>
      </div>
    </form>
  );
}

export default GuestForm;
