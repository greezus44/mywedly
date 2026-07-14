import type { EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";

export interface GuestFormValues {
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  group_name: string | null;
  side: string | null;
  group_id: string | null;
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  table_number: string | null;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name,
    username: guest.username,
    email: guest.email,
    phone: guest.phone,
    group_name: guest.group_name,
    side: guest.side,
    group_id: guest.group_id,
    plus_ones: guest.plus_ones,
    dietary: guest.dietary,
    message: guest.message,
    table_number: guest.table_number,
  };
}

export function emptyGuestForm(): GuestFormValues {
  return {
    name: "",
    username: null,
    email: null,
    phone: null,
    group_name: null,
    side: null,
    group_id: null,
    plus_ones: 0,
    dietary: null,
    message: null,
    table_number: null,
  };
}

export function RsvpBadge({ status }: { status: string | null }) {
  switch (status) {
    case "attending":
      return <Badge variant="success">Attending</Badge>;
    case "not_attending":
      return <Badge variant="danger">Not Attending</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">No Response</Badge>;
  }
}

export const GUEST_SIDES = [
  { label: "Bride", value: "bride" },
  { label: "Groom", value: "groom" },
  { label: "Both", value: "both" },
  { label: "Other", value: "other" },
];
