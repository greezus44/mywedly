-- Add draft columns for live preview system
-- draft_content stores unpublished content changes (cover page, etc.)
-- draft_theme_config stores unpublished theme changes
-- website_content.draft_body stores unpublished content section body changes

ALTER TABLE weddings ADD COLUMN IF NOT EXISTS draft_content jsonb DEFAULT '{}'::jsonb;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS draft_theme_config jsonb;

ALTER TABLE website_content ADD COLUMN IF NOT EXISTS draft_title text;
ALTER TABLE website_content ADD COLUMN IF NOT EXISTS draft_body text;
ALTER TABLE website_content ADD COLUMN IF NOT EXISTS draft_image_url text;
ALTER TABLE website_content ADD COLUMN IF NOT EXISTS draft_is_published boolean;
