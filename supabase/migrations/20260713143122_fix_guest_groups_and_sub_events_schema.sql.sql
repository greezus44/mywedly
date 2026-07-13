/*
# Fix Guest Groups and Sub Events Schema

## Problem 1: guest_groups.wedding_id NOT NULL constraint
The `guest_groups` table has `wedding_id` as NOT NULL with a FK to the `weddings` table.
However, the application uses `user_events` (not `weddings`) as the primary events table.
The `weddings` table has 0 rows. When the app tries to insert a guest group with only
`event_id` (FK to `user_events`), the `wedding_id` NOT NULL constraint fails.

## Fix 1: Make wedding_id nullable
Since the app uses `event_id` as the primary relationship, `wedding_id` should be nullable.
This preserves existing data while allowing new inserts via `event_id`.

## Problem 2: sub_events missing columns
The spec requires `start_time`, `end_time`, `display_order`, and `wedding_id` columns.
Currently `sub_events` has `time` (single time) and `order_index` (not `display_order`).

## Fix 2: Add missing columns to sub_events
- Add `start_time` (time without time zone, nullable) — for event start
- Add `end_time` (time without time zone, nullable) — for event end
- Add `display_order` (integer, default 0) — alias for order_index ordering
- Add `wedding_id` (uuid, nullable) — optional link to weddings table

## Problem 3: group_event_invites FK to 'events' table
The `group_event_invites.event_id` has FK to `events` table, but app uses `user_events`.
This is left as-is since changing FKs could lose data. The app will use `sub_event_id` instead.

## Changes:
1. ALTER guest_groups: make wedding_id nullable
2. ALTER sub_events: add start_time, end_time, display_order, wedding_id columns
3. No data loss — all changes are additive or relax constraints
*/

-- Fix 1: Make wedding_id nullable on guest_groups
ALTER TABLE guest_groups ALTER COLUMN wedding_id DROP NOT NULL;

-- Fix 2: Add missing columns to sub_events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sub_events' AND column_name = 'start_time') THEN
    ALTER TABLE sub_events ADD COLUMN start_time time without time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sub_events' AND column_name = 'end_time') THEN
    ALTER TABLE sub_events ADD COLUMN end_time time without time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sub_events' AND column_name = 'display_order') THEN
    ALTER TABLE sub_events ADD COLUMN display_order integer NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sub_events' AND column_name = 'wedding_id') THEN
    ALTER TABLE sub_events ADD COLUMN wedding_id uuid;
  END IF;
END $$;

-- Migrate data: copy `time` to `start_time` where start_time is null
UPDATE sub_events SET start_time = "time" WHERE start_time IS NULL AND "time" IS NOT NULL;

-- Migrate data: copy `order_index` to `display_order` where they differ
UPDATE sub_events SET display_order = order_index WHERE display_order != order_index;
