/*
# Add allow_plus_one column to event_guests

1. Changes
- Added `allow_plus_one` boolean column to `event_guests`, defaulting to `false`.
- This lets hosts individually control whether each guest may bring a +1.
- Existing guests default to `false` (no behavior change).
2. Security
- No RLS policy changes. The column is readable/writable by the same roles that already
  access `event_guests`.
*/

ALTER TABLE event_guests
ADD COLUMN IF NOT EXISTS allow_plus_one boolean NOT NULL DEFAULT false;
