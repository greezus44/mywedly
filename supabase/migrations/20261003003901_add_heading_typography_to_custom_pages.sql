/*
# Add heading_typography column to custom_pages

1. Changes
- Adds `heading_typography` (jsonb, nullable) to `custom_pages`.
  Stores optional font/size/weight/colour/alignment settings for the
  page heading shown on the guest custom page, so editors can style
  the heading independently of the global theme.

2. Security
- No RLS or policy changes. Existing policies on `custom_pages` remain unchanged.
*/

ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS heading_typography jsonb DEFAULT null;
