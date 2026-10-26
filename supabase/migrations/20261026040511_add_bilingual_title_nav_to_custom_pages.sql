/*
# Add bilingual title and nav label columns to custom_pages

1. Changes
- Adds `title_bm` (text, nullable) to `custom_pages`.
  Stores the optional Bahasa Melayu version of the page title shown
  on the guest custom page heading when the guest has switched to BM.
  Falls back to the English `title` when empty.
- Adds `nav_label_bm` (text, nullable) to `custom_pages`.
  Stores the optional Bahasa Melayu version of the navigation label
  shown in the guest site navigation menu when the guest has switched
  to BM. Falls back to the English `nav_label` when empty.

2. Security
- No RLS or policy changes. Existing policies on `custom_pages` remain unchanged.
- Block content is stored inside the existing `blocks` jsonb column; the new
  bilingual block text fields are added as optional properties on each block's
  content object, so no schema change is needed for blocks.
*/

ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS title_bm text DEFAULT null;

ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS nav_label_bm text DEFAULT null;
