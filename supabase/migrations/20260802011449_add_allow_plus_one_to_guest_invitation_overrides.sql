/*
# Add allow_plus_one column to guest_invitation_overrides

## Changes

1. Added `allow_plus_one` boolean column to `guest_invitation_overrides`, defaulting to `false`.
   - This allows hosts to configure +1 permissions separately for each invited event.
   - Example: Guest invited to Ceremony (+1 allowed), Dinner (+1 NOT allowed), After Party (+1 allowed).

## Security
- No RLS policy changes. The column is accessible by the same roles that already access the table.
*/

ALTER TABLE guest_invitation_overrides
ADD COLUMN IF NOT EXISTS allow_plus_one boolean NOT NULL DEFAULT false;
