import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui";
import { generateUsername } from "../../lib/utils";
import type { GuestGroup, EventGuest } from "../../lib/supabase";

export interface GuestForm {
  name: string; username: string; email: string; phone: string;
  group_id: string | null; group_name: string; side: string; plus_ones: number;
}

export const emptyForm: GuestForm = {
  name: "", username: "", email: "", phone: "",
  group_id: null, group_name: "", side: "", plus_ones: 0,
};

export function RsvpBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
    attending: { label: "✓", variant: "success" },
    not_attending: { label: "✗", variant: "danger" },
    maybe: { label: "?", variant: "warning" },
    pending: { label: "Pending", variant: "default" },
  };
  const cfg = config[status] ?? config.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function GuestFormFields({
  form,
  setForm,
  groups,
  groupMap,
  usernameError,
  setUsernameError,
}: {
  form: GuestForm;
  setForm: React.Dispatch<React.SetStateAction<GuestForm>>;
  groups: GuestGroup[];
  groupMap: Record<string, string>;
  usernameError: string | null;
  setUsernameError: (v: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <Input label="Name" value={form.name} placeholder="Guest full name" required autoFocus
        onChange={(e) => {
          const name = e.target.value;
          setForm({ ...form, name, username: form.username || generateUsername(name) });
        }} />
      <div>
        <Input label="Username" value={form.username} placeholder="unique username"
          error={usernameError ?? undefined}
          onChange={(e) => { setForm({ ...form, username: e.target.value }); setUsernameError(null); }} />
        <button type="button"
          onClick={() => setForm({ ...form, username: generateUsername(form.name) })}
          className="mt-1 text-xs text-dash-primary hover:text-dash-primary-hover">
          Auto-generate
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" type="email" value={form.email} placeholder="guest@example.com"
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" value={form.phone} placeholder="+1 555 000 0000"
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Group" value={form.group_id ?? ""}
          onChange={(e) => {
            const groupId = e.target.value || null;
            setForm({ ...form, group_id: groupId,
              group_name: groupId ? (groupMap[groupId] ?? "") : form.group_name });
          }}>
          <option value="">No group</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
        <Select label="Side" value={form.side}
          onChange={(e) => setForm({ ...form, side: e.target.value })}>
          <option value="">No side</option>
          <option value="bride">Bride's side</option>
          <option value="groom">Groom's side</option>
          <option value="both">Both</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <Input label="Plus Ones" type="number" value={form.plus_ones} min={0}
        onChange={(e) => setForm({ ...form, plus_ones: Number(e.target.value) })} />
    </div>
  );
}

export function guestToForm(guest: EventGuest): GuestForm {
  return {
    name: guest.name, username: guest.username ?? "", email: guest.email ?? "",
    phone: guest.phone ?? "", group_id: guest.group_id,
    group_name: guest.group_name ?? "", side: guest.side ?? "",
    plus_ones: guest.plus_ones,
  };
}
