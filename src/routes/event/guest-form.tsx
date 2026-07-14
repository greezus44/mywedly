import { useState, useEffect } from "react";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Badge, LoadingSpinner } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormValues {
  name: string;
  username: string;
  email: string;
  phone: string;
  plus_one_allowed: boolean;
  group_id: string;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name,
    username: guest.username,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    plus_one_allowed: guest.plus_one_allowed,
    group_id: "",
  };
}

export function emptyGuestForm(name = ""): GuestFormValues {
  return {
    name,
    username: "",
    email: "",
    phone: "",
    plus_one_allowed: false,
    group_id: "",
  };
}

export function RsvpBadge({ status }: { status: "attending" | "not_attending" | "pending" | undefined }) {
  if (!status || status === "pending") {
    return <Badge variant="warning">Pending</Badge>;
  }
  if (status === "attending") {
    return <Badge variant="success">Attending</Badge>;
  }
  return <Badge variant="danger">Not Attending</Badge>;
}

export interface GuestFormProps {
  eventId: string;
  initial?: GuestFormValues;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function GuestForm({ eventId, initial, onSubmit, onCancel, submitting }: GuestFormProps) {
  const [values, setValues] = useState<GuestFormValues>(
    initial ?? emptyGuestForm()
  );
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    if (initial) setValues(initial);
  }, [initial]);

  useEffect(() => {
    supabase
      .from("guest_groups")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setGroups(data as GuestGroup[]);
        setLoadingGroups(false);
      });
  }, [eventId]);

  function update<K extends keyof GuestFormValues>(key: K, val: GuestFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let finalValues = values;
    if (!finalValues.username && finalValues.name) {
      finalValues = { ...finalValues, username: generateUsername(finalValues.name) };
    }
    await onSubmit(finalValues);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full name"
        type="text"
        value={values.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Guest name"
        required
        autoFocus
      />
      <Input
        label="Username"
        type="text"
        value={values.username}
        onChange={(e) => update("username", e.target.value)}
        placeholder="Auto-generated if left blank"
      />
      <Input
        label="Email (optional)"
        type="email"
        value={values.email}
        onChange={(e) => update("email", e.target.value)}
        placeholder="guest@example.com"
      />
      <Input
        label="Phone (optional)"
        type="tel"
        value={values.phone}
        onChange={(e) => update("phone", e.target.value)}
        placeholder="+1 555 0100"
      />
      {loadingGroups ? (
        <LoadingSpinner size="sm" />
      ) : (
        <Select
          label="Guest group (optional)"
          value={values.group_id}
          onChange={(e) => update("group_id", e.target.value)}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      )}
      <label className="flex items-center gap-2 text-sm text-dash-text">
        <input
          type="checkbox"
          checked={values.plus_one_allowed}
          onChange={(e) => update("plus_one_allowed", e.target.checked)}
          className="rounded"
        />
        Plus one allowed
      </label>
      <div className="flex gap-2">
        <Button type="submit" loading={submitting} disabled={submitting}>
          Save Guest
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
