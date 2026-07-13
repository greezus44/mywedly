/*
# Add draft_cover_config column to weddings

## Purpose
The cover_config column already exists for published cover config. We need a draft_cover_config column to store draft cover customisation separately, matching the draft_content/draft_theme_config pattern.

## Changes
1. Add `draft_cover_config` jsonb column to weddings table (if not exists)
*/

ALTER TABLE weddings ADD COLUMN IF NOT EXISTS draft_cover_config jsonb;
