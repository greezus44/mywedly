/*
# Add bilingual (Malay) title columns for events and programme items

## Purpose
Allows hosts to enter Malay-language titles and descriptions for sub-events,
main events, and programme/schedule items. The guest RSVP page will display
the Malay version when the language toggle is set to Bahasa Malaysia, falling
back to the English value if the Malay field is left empty.

## Changes

### 1. sub_events table
- Added `name_bm` (text, nullable) — Malay sub-event title

### 2. user_events table
- Added `name_bm` (text, nullable) — Malay main event title

### 3. event_schedule table
- Added `title_bm` (text, nullable) — Malay programme item title
- Added `description_bm` (text, nullable) — Malay programme item description

## Security
- No RLS policy changes. Existing policies remain in effect.
- All new columns are nullable with no defaults, so existing rows are unaffected.

## Notes
- All columns use `IF NOT EXISTS` guards so the migration is safe to re-run.
- No data is lost or transformed; existing English columns remain the primary values.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sub_events' AND column_name = 'name_bm') THEN
    ALTER TABLE sub_events ADD COLUMN name_bm text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_events' AND column_name = 'name_bm') THEN
    ALTER TABLE user_events ADD COLUMN name_bm text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_schedule' AND column_name = 'title_bm') THEN
    ALTER TABLE event_schedule ADD COLUMN title_bm text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_schedule' AND column_name = 'description_bm') THEN
    ALTER TABLE event_schedule ADD COLUMN description_bm text;
  END IF;
END $$;
