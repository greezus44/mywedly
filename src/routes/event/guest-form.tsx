import React from "react";
import type { EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";
import { generateUsername } from "../../lib/utils";

export interface GuestFormFields {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
  group_id: string | null;
  plus_ones: number;
  table_number: number | null;
}

export function guestToForm(guest: EventGuest): GuestFormFields {
  return {
    name: guest.name,
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    group_id: guest.group_id,
    plus_ones: guest.plus_ones ?? 0,
    table_number: guest.table_number,
  };
}

export const EMPTY_GUEST_FORM: GuestFormFields = {
  name: "",
  username: "",
  email: "",
  phone: "",
  group_name: "",
  side: "",
  group_id: null,
  plus_ones: 0,
  table_number: null,
};

export interface RsvpBadgeProps {
  status: string;
  className?: string;
}

export function RsvpBadge({ status, className }: RsvpBadgeProps): React.ReactElement {
  const variant =
    status === "attending" ? "success" :
    status === "declined" ? "danger" :
    "warning";
  const label = status === "attending" ? "Attending" :
    status === "declined" ? "Declined" :
    status || "Pending";
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export { generateUsername };
