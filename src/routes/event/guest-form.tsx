import { useState, useEffect, type FormEvent } from "react";
import { type EventGuest, type GuestGroup } from "../../lib/supabase";
import { generateUsername } from "../../lib/utils";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui";

export interface GuestFormState {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string;
  group_name: string;
  side: string;
  plus_ones: number;
  dietary: string;
  message: string;
  rsvp_status: string;
  table_number: string;
}

export function guestToForm(guest: EventGuest | null): GuestFormState {
  if (!guest) {
    return {
      name: "",
      username: "",
      email: "",
      phone: "",
      group_id: "",
      group_name: "",
      side: "",
      plus_ones: 0,
      dietary: "",
      message: "",
      rsvp_status: "pending",
      table_number: "",
    };
  }
  return {
    name: guest.name,
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_id: guest.group_id ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    rsvp_status: guest.rsvp_status ?? "pending",
    table_number:
      guest.table_number !== null ? String(guest.table_number) : "",
  };
}

const RSVP_VARIANTS: Record<string, "default" | "success" | "danger" | "warning"> = {
  attending: "success",
  declined: "danger",
  pending: "warning",
};

export function RsvpBadge({ status }: { status: string }) {
  return (
    <Badge variant={RSVP_VARIANTS[status] ?? "default"}>{status}</Badge>
  );
}

interface GuestFormProps {
  initial: GuestFormState;
  groups: GuestGroup[];
  onSubmit: (state: GuestFormState) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isUsernameTaken?: (username: string, excludeGuestId?: string) => boolean;
  editingId?: string | null;
}

export function GuestForm({
  initial,
  groups,
  onSubmit,
  onCancel,
  loading,
  error,
  isUsernameTaken,
  editingId,
}: GuestFormProps) {
  const [form, setForm] = useState<GuestFormState>(initial);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const update = <K extends keyof GuestFormState>(
    key: K,
    value: GuestFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUsernameChange = (value: string) => {
    update("username", value);
    if (value && isUsernameTaken && isUsernameTaken(value, editingId ?? undefined)) {
      setUsernameError("This username is already taken.");
    } else {
      setUsernameError(null);
    }
  };

  const handleAutoGenerate = () => {
    const generated = generateUsername(form.name);
    handleUsernameChange(generated);
  };

  const handleGroupChange = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    update("group_id", groupId);
    update("group_name", group?.name ?? "");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (usernameError) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Guest full name"
        required
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Username</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="Auto-generated if empty"
            className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="rounded-md border border-border bg-surface-alt px-3 text-sm text-muted hover:bg-muted/20"
          >
            Auto
          </button>
        </div>
        {usernameError && <p className="text-xs text-danger">{usernameError}</p>}
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
          onChange={(e) => handleGroupChange(e.target.value)}
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
          onChange={(e) => update("side", e.target.value)}
        >
          <option value="">—</option>
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
          <option value="both">Both</option>
          <option value="other">Other</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Plus Ones"
          type="number"
          value={form.plus_ones}
          onChange={(e) => update("plus_ones", Number(e.target.value))}
          min={0}
        />
        <Input
          label="Table Number"
          type="number"
          value={form.table_number}
          onChange={(e) => update("table_number", e.target.value)}
          min={0}
        />
      </div>

      <Select
        label="RSVP Status"
        value={form.rsvp_status}
        onChange={(e) => update("rsvp_status", e.target.value)}
      >
        <option value="pending">Pending</option>
        <option value="attending">Attending</option>
        <option value="declined">Declined</option>
      </Select>

      <Textarea
        label="Dietary Requirements"
        value={form.dietary}
        onChange={(e) => update("dietary", e.target.value)}
        placeholder="Allergies, preferences..."
        rows={2}
      />

      <Textarea
        label="Message"
        value={form.message}
        onChange={(e) => update("message", e.target.value)}
        placeholder="Guest message..."
        rows={2}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
