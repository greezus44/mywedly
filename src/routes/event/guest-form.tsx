import type { EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface GuestFormValues {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string | null;
  group_name: string | null;
  side: string;
  plus_ones: number;
  dietary: string;
  message: string;
  table_number: number | null;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name,
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_id: guest.group_id,
    group_name: guest.group_name,
    side: guest.side ?? "",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    table_number: guest.table_number,
  };
}

export function emptyGuestForm(): GuestFormValues {
  return {
    name: "",
    username: "",
    email: "",
    phone: "",
    group_id: null,
    group_name: null,
    side: "",
    plus_ones: 0,
    dietary: "",
    message: "",
    table_number: null,
  };
}

interface RsvpBadgeProps {
  status: string;
  className?: string;
}

export function RsvpBadge({ status, className }: RsvpBadgeProps) {
  const variant =
    status === "attending"
      ? "success"
      : status === "declined"
      ? "danger"
      : status === "pending"
      ? "warning"
      : "default";

  const label =
    status === "attending"
      ? "Attending"
      : status === "declined"
      ? "Declined"
      : status === "pending"
      ? "Pending"
      : status || "Not responded";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

interface InvitedChipProps {
  label: string;
  invited: boolean;
  onClick: () => void;
  loading?: boolean;
}

export function InvitedChip({ label, invited, onClick, loading }: InvitedChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        invited
          ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          : "border-dash-border bg-dash-bg text-dash-muted hover:bg-dash-surface",
        loading && "opacity-50"
      )}
    >
      {invited ? "✓ " : ""}
      {label}
    </button>
  );
}
