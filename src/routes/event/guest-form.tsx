import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Badge, FormField } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

// ---------------------------------------------------------------------------
// RsvpBadge
// ---------------------------------------------------------------------------
const RSVP_VARIANTS: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success",
  declined: "danger",
  pending: "warning",
  maybe: "warning",
};

export function RsvpBadge({ status }: { status: string | null }) {
  const value = status ?? "pending";
  return <Badge variant={RSVP_VARIANTS[value] ?? "default"}>{value}</Badge>;
}

// ---------------------------------------------------------------------------
// guestToForm
// ---------------------------------------------------------------------------
export interface GuestFormValues {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  plus_ones: number;
  dietary: string;
  table_number: string;
  username: string;
  group_id: string;
  rsvp_status: string;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    table_number: guest.table_number ?? "",
    username: guest.username ?? "",
    group_id: guest.group_id ?? "",
    rsvp_status: guest.rsvp_status ?? "",
  };
}

const EMPTY_FORM: GuestFormValues = {
  name: "",
  email: "",
  phone: "",
  group_name: "",
  side: "",
  plus_ones: 0,
  dietary: "",
  table_number: "",
  username: "",
  group_id: "",
  rsvp_status: "",
};

// ---------------------------------------------------------------------------
// GuestForm
// ---------------------------------------------------------------------------
interface GuestFormProps {
  eventId: string;
  guest?: EventGuest | null;
  groups?: GuestGroup[];
  onSaved?: () => void;
  onCancel?: () => void;
}

export function GuestForm({ eventId, guest, groups, onSaved, onCancel }: GuestFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GuestFormValues>(guest ? guestToForm(guest) : EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof GuestFormValues>(key: K, val: GuestFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");

      const username = form.username.trim() || generateUsername(form.name);

      if (guest) {
        const { error } = await supabase
          .from("event_guests")
          .update({
            name: form.name.trim(),
            email: form.email || null,
            phone: form.phone || null,
            group_name: form.group_name || null,
            side: form.side || null,
            plus_ones: form.plus_ones,
            dietary: form.dietary || null,
            table_number: form.table_number || null,
            username,
            group_id: form.group_id || null,
            rsvp_status: form.rsvp_status || null,
          })
          .eq("id", guest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_guests")
          .insert({
            event_id: eventId,
            name: form.name.trim(),
            email: form.email || null,
            phone: form.phone || null,
            group_name: form.group_name || null,
            side: form.side || null,
            plus_ones: form.plus_ones,
            dietary: form.dietary || null,
            table_number: form.table_number || null,
            username,
            group_id: form.group_id || null,
            rsvp_status: form.rsvp_status || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      onSaved?.();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save guest");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="e.g. Jane Smith"
        required
        autoFocus
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="jane@example.com"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+44 1234 567890"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Group Name"
          value={form.group_name}
          onChange={(e) => update("group_name", e.target.value)}
          placeholder="e.g. Bride's Family"
        />
        <Select
          label="Assigned Group"
          value={form.group_id}
          onChange={(e) => update("group_id", e.target.value)}
        >
          <option value="">No group</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Side"
          value={form.side}
          onChange={(e) => update("side", e.target.value)}
        >
          <option value="">No side</option>
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
          <option value="both">Both</option>
          <option value="other">Other</option>
        </Select>
        <Input
          label="Plus Ones"
          type="number"
          min={0}
          max={10}
          value={form.plus_ones}
          onChange={(e) => update("plus_ones", parseInt(e.target.value, 10) || 0)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Dietary Requirements"
          value={form.dietary}
          onChange={(e) => update("dietary", e.target.value)}
          placeholder="e.g. Vegetarian"
        />
        <Input
          label="Table Number"
          value={form.table_number}
          onChange={(e) => update("table_number", e.target.value)}
          placeholder="e.g. Table 5"
        />
      </div>
      <FormField label="Username" hint="Guests use this username to log in to the invitation site.">
        <Input
          value={form.username}
          onChange={(e) => update("username", e.target.value)}
          placeholder="Auto-generated from name if empty"
        />
      </FormField>
      <Select
        label="RSVP Status"
        value={form.rsvp_status}
        onChange={(e) => update("rsvp_status", e.target.value)}
      >
        <option value="">Not responded</option>
        <option value="attending">Attending</option>
        <option value="declined">Declined</option>
        <option value="pending">Pending</option>
      </Select>

      {error && <p className="text-sm text-dash-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit" loading={saveMutation.isPending}>
          {guest ? "Update Guest" : "Add Guest"}
        </Button>
      </div>
    </form>
  );
}
