/*
# Add login_config and draft_login_config columns to weddings

1. Modified Tables
- `weddings`
  - Add `login_config` (jsonb, nullable) — stores the published sign-in page configuration
  - Add `draft_login_config` (jsonb, nullable) — stores the draft sign-in page configuration for editing

2. Important Notes
- Both columns are nullable so existing weddings are unaffected.
- The frontend reads `draft_login_config` first, falling back to `login_config`, then to defaults.
- No RLS policy changes needed — existing wedding policies cover these columns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'login_config'
  ) THEN
    ALTER TABLE weddings ADD COLUMN login_config jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weddings' AND column_name = 'draft_login_config'
  ) THEN
    ALTER TABLE weddings ADD COLUMN draft_login_config jsonb;
  END IF;
END $$;
