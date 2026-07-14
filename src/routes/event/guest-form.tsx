import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button, Input, Select, Badge } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  table_number: string;
  group_id: string;
}

export function guestToForm(guest: EventGuest | null): GuestFormValues {
  return {
    full_name: guest?.full_name ?? "",
    username: guest?.username ?? "",
    email: guest?.email ?? "",
    phone: guest?.phone ?? "",
    table_number: guest?.table_number ?? "",
    group_id: guest?.group_id ?? "",
  };
}

interface GuestFormProps {
  eventId: string;
  groups: GuestGroup[];
  guest: EventGuest | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GuestForm({ eventId, groups, guest, onSuccess, onCancel }: GuestFormProps) {
  const [form, setForm] = useState<GuestFormValues>(() => guestToForm(guest));
  const [usernameManual, setUsernameManual] = useState(!!guest);

  function setField<K extends keyof GuestFormValues>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleNameChange(name: string) {
    setField("full_name", name);
    if (!usernameManual) {
      setField("username", generateUsername(name));
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        table_number: form.table_number.trim() || null,
        group_id: form.group_id || null,
      };
      if (guest) {
        const { error } = await supabase.from("event_guests").update(payload).eq("id", guest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_guests").insert({ event_id: eventId, ...payload });
        if (error) throw error;
      }
    },
    onSuccess,
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="space-y-4"
    >
      <Input
        label="Full Name"
        value={form.full_name}
        onChange={(e) => handleNameChange(e.target.value)}
        required
        autoFocus
      />
      <div>
        <Input
          label="Username (for sign-in)"
          value={form.username}
          onChange={(e) => { setUsernameManual(true); setField("username", e.target.value); }}
          required
          placeholder="e.g. sarah.jones"
        />
        <p className="mt-1 text-xs text-dash-muted">
          Guests use this to access the invitation website.
        </p>
      </div>
      <Input
        label="Email (optional)"
        type="email"
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
      />
      <Input
        label="Phone (optional)"
        type="tel"
        value={form.phone}
        onChange={(e) => setField("phone", e.target.value)}
      />
      <Input
        label="Table Number (optional)"
        value={form.table_number}
        onChange={(e) => setField("table_number", e.target.value)}
        placeholder="e.g. 5"
      />
      {groups.length > 0 && (
        <Select
          label="Group (optional)"
          value={form.group_id}
          onChange={(e) => setField("group_id", e.target.value)}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      )}

      {mutation.isError && (
        <p className="text-sm text-red-500">{(mutation.error as Error)?.message}</p>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending} disabled={!form.full_name || !form.username}>
          {guest ? "Save" : "Add guest"}
        </Button>
      </div>
    </form>
  );
}

interface RsvpBadgeProps {
  status: string | null;
}

export function RsvpBadge({ status }: RsvpBadgeProps) {
  if (!status) return <Badge variant="default">Pending</Badge>;
  if (status === "attending") return <Badge variant="success">Attending</Badge>;
  if (status === "declined") return <Badge variant="danger">Declined</Badge>;
  return <Badge variant="default">{status}</Badge>;
}
