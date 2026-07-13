/*
# Fix Custom Pages Creation

## Problem
The `custom_pages` table has `wedding_id` as NOT NULL with a foreign key to the `weddings` table.
The application creates custom pages associated with `user_events` (via `event_id`), not `weddings`.
When inserting a new custom page, the `wedding_id` column has no value and no default, causing a
NOT NULL constraint violation that silently blocks page creation.

## Changes
1. Alter `custom_pages.wedding_id` to be nullable so pages can be created with only `event_id`.
2. Drop the unique constraint `(wedding_id, slug)` which requires a non-null `wedding_id`.
3. Add a new unique constraint `(event_id, slug)` to ensure slug uniqueness per event instead.
4. Add an INSERT policy that allows inserting when `event_id` matches a user_event owned by the
   authenticated user (the existing `host_insert_custom_pages` policy already does this, but
   the NOT NULL constraint on `wedding_id` was the actual blocker).

## Security
- No changes to RLS policies — existing policies already correctly scope by `event_id`.
- The `host_insert_custom_pages` INSERT policy already checks `event_id` against `user_events.creator_id = auth.uid()`.
- The `host_select_custom_pages`, `host_update_custom_pages`, and `host_delete_custom_pages` policies
  already work via `event_id`. Making `wedding_id` nullable does not weaken any security.

## Important Notes
1. `wedding_id` is now nullable — pages can be associated with either a `wedding` or a `user_event`.
2. Existing pages with `wedding_id` values are NOT affected — they retain their associations.
3. Slug uniqueness is now enforced per `event_id` instead of per `wedding_id`.
4. The `custom_pages_wedding_id_fkey` foreign key is retained for backward compatibility.
*/

-- Make wedding_id nullable so pages can be created with only event_id
ALTER TABLE public.custom_pages ALTER COLUMN wedding_id DROP NOT NULL;

-- Drop the old unique constraint that required wedding_id
ALTER TABLE public.custom_pages DROP CONSTRAINT IF EXISTS custom_pages_wedding_id_slug_key;

-- Add a new unique constraint on (event_id, slug) for per-event slug uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_pages_event_id_slug_key'
  ) THEN
    ALTER TABLE public.custom_pages ADD CONSTRAINT custom_pages_event_id_slug_key UNIQUE (event_id, slug);
  END IF;
END $$;
