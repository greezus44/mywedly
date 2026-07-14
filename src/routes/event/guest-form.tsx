import type { EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";

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

export function guestToForm(guest: EventGuest): GuestFormFields {
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

export function emptyGuestForm(): GuestFormFields {
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

const rsvpBadgeVariants: Record<string, "success" | "danger" | "warning" | "default"> = {
  attending: "success",
  not_attending: "danger",
  pending: "warning",
  no_response: "warning",
};

export function RsvpBadge({ status }: { status: string }) {
  const variant = rsvpBadgeVariants[status] ?? "default";
  const labels: Record<string, string> = {
    attending: "Attending",
    not_attending: "Not Attending",
    pending: "Pending",
    no_response: "No Response",
  };
  return <Badge variant={variant}>{labels[status] ?? status}</Badge>;
}
