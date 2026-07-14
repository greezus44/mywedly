/*
# Add group_id column to event_guests

## Problem
The application references a `group_id` column on the `event_guests` table, but this column
does not exist in the database schema. This causes the error:
"Could not find the 'group_id' column of 'event_guests' in the schema cache"

The application's EventGuest interface declares `group_id: string | null` and uses it to
link guests to their guest groups. The `event_guests` table currently has a `group_name`
text column but no foreign key reference to `guest_groups`.

## Changes
1. Add `group_id` column to `event_guests` as a nullable uuid with a foreign key to
   `guest_groups(id)` with `ON DELETE SET NULL`.
2. Add an index on `group_id` for efficient lookups when filtering guests by group.

## Security
- No RLS policy changes needed — the existing policies on `event_guests` already scope by
  `event_id` → `user_events.creator_id = auth.uid()`. Adding a nullable column does not
  weaken any existing security.
- The foreign key to `guest_groups` is safe because `guest_groups` already has its own
  RLS policies scoped by `event_id` → `user_events.creator_id = auth.uid()`.

## Important Notes
1. The column is nullable so existing rows are unaffected — their `group_id` will be NULL.
2. The `group_name` text column is retained for backward compatibility.
3. The foreign key uses `ON DELETE SET NULL` so deleting a group doesn't delete the guest.
4. This is a non-breaking, additive migration.
*/

-- Add group_id column to event_guests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_guests' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.event_guests ADD COLUMN group_id uuid;
  END IF;
END $$;

-- Add foreign key constraint to guest_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_guests_group_id_fkey'
  ) THEN
    ALTER TABLE public.event_guests
    ADD CONSTRAINT event_guests_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES public.guest_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for efficient group-based lookups
CREATE INDEX IF NOT EXISTS idx_event_guests_group_id ON public.event_guests(group_id);
