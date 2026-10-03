/*
# Add tab_name column to sub_events

1. New Columns
- `sub_events.tab_name` (text, nullable) — Optional short display name for the guest list tab.
  Hosts can set this to shorten long event names for the tab labels in the guest list.
  If null, the full event name is used. Only hosts see this; guests never see it.

2. Security
- No RLS or policy changes. Existing policies on sub_events remain unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_events' AND column_name = 'tab_name'
  ) THEN
    ALTER TABLE sub_events ADD COLUMN tab_name text;
  END IF;
END $$;
